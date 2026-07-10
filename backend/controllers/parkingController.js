const { getPool } = require('../config/db');
const { generateTicketId } = require('../utils/ticketGenerator');
const { calculateFare } = require('../utils/fareCalculator');

// Parking limits defined by business logic (not stored in DB)
const LIMITS = {
  bike: 5,
  car: 5,
  truck: 2,
};

/**
 * Format a Javascript Date to MySQL DATETIME format (YYYY-MM-DD HH:mm:ss) in local time.
 */
function formatLocalMySQLDateTime(date) {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * GET /api/slots
 * Returns occupied and available counts for all vehicle types.
 */
exports.getSlots = async (req, res, next) => {
  try {
    const pool = getPool();
    // Query active tickets count grouped by vehicle type
    const [rows] = await pool.query(
      "SELECT vehicle_type, COUNT(*) as occupied FROM tickets WHERE status = 'parked' GROUP BY vehicle_type"
    );

    // Build the results mapping limits
    const slotsStatus = {
      bike: { total: LIMITS.bike, available: LIMITS.bike },
      car: { total: LIMITS.car, available: LIMITS.car },
      truck: { total: LIMITS.truck, available: LIMITS.truck },
    };

    rows.forEach((row) => {
      const type = row.vehicle_type;
      if (slotsStatus[type]) {
        const occupied = parseInt(row.occupied, 10);
        slotsStatus[type].available = Math.max(0, LIMITS[type] - occupied);
      }
    });

    res.status(200).json(slotsStatus);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/park
 * Parks a vehicle, assigns a slot, generates a ticket.
 */
exports.parkVehicle = async (req, res, next) => {
  const { vehicleNumber, vehicleType } = req.body;

  // 1. Validation: Missing fields
  if (!vehicleNumber || !vehicleType) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle number and vehicle type are required.',
    });
  }

  // 2. Validation: Invalid vehicle type
  const typeLower = vehicleType.toLowerCase();
  if (!LIMITS.hasOwnProperty(typeLower)) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle type. Must be 'bike', 'car', or 'truck'.",
    });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 3. Validation: Vehicle cannot already be parked
    const [existingParked] = await connection.query(
      "SELECT * FROM tickets WHERE vehicle_number = ? AND status = 'parked'",
      [vehicleNumber]
    );

    if (existingParked.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Vehicle ${vehicleNumber} is already parked at slot ${existingParked[0].slot_number}.`,
      });
    }

    // 4. Validation: Check if type capacity is full
    const [parkedCountRows] = await connection.query(
      "SELECT COUNT(*) as count FROM tickets WHERE vehicle_type = ? AND status = 'parked'",
      [typeLower]
    );
    const occupiedCount = parkedCountRows[0].count;

    if (occupiedCount >= LIMITS[typeLower]) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Parking Full',
      });
    }

    // 5. Select the first available slot of this type
    const [availableSlots] = await connection.query(
      'SELECT * FROM slots WHERE slot_type = ? AND is_occupied = FALSE ORDER BY slot_number ASC LIMIT 1 FOR UPDATE',
      [typeLower]
    );

    if (availableSlots.length === 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Parking Full', // Fallback in case of slot mismatch
      });
    }

    const assignedSlot = availableSlots[0];

    // 6. Mark slot as occupied
    await connection.query('UPDATE slots SET is_occupied = TRUE WHERE id = ?', [assignedSlot.id]);

    // 7. Generate Ticket ID
    const ticketId = await generateTicketId(connection);
    const entryTime = new Date();
    const entryTimeStr = formatLocalMySQLDateTime(entryTime);

    // 8. Insert new ticket
    await connection.query(
      'INSERT INTO tickets (ticket_id, vehicle_number, vehicle_type, entry_time, slot_number, status) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, vehicleNumber, typeLower, entryTimeStr, assignedSlot.slot_number, 'parked']
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      ticket: {
        ticketId,
        vehicleNumber,
        vehicleType: typeLower,
        entryTime: entryTimeStr,
        slotNumber: assignedSlot.slot_number,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * POST /api/exit
 * Exits a vehicle, frees the slot, calculates fare.
 */
exports.exitVehicle = async (req, res, next) => {
  const { ticketId, vehicleNumber } = req.body;

  // 1. Validation: Invalid request body
  if (!ticketId && !vehicleNumber) {
    return res.status(400).json({
      success: false,
      message: 'Either ticketId or vehicleNumber is required to exit a vehicle.',
    });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 2. Find active ticket
    let activeTicket = null;
    if (ticketId) {
      const [rows] = await connection.query(
        "SELECT * FROM tickets WHERE ticket_id = ? AND status = 'parked'",
        [ticketId]
      );
      if (rows.length > 0) activeTicket = rows[0];
    } else {
      const [rows] = await connection.query(
        "SELECT * FROM tickets WHERE vehicle_number = ? AND status = 'parked'",
        [vehicleNumber]
      );
      if (rows.length > 0) activeTicket = rows[0];
    }

    // 3. Handle Ticket Not Found / Already Exited
    if (!activeTicket) {
      // Check if ticket exists in database at all (to differentiate 404 from 400 already exited)
      let queryVal = ticketId || vehicleNumber;
      let queryCol = ticketId ? 'ticket_id' : 'vehicle_number';
      const [anyTicketRows] = await connection.query(
        `SELECT * FROM tickets WHERE ${queryCol} = ? ORDER BY entry_time DESC LIMIT 1`,
        [queryVal]
      );

      await connection.rollback();

      if (anyTicketRows.length > 0 && anyTicketRows[0].status === 'exited') {
        return res.status(400).json({
          success: false,
          message: 'Vehicle has already exited.',
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Active parking ticket not found.',
      });
    }

    // 4. Calculate fare
    const exitTime = new Date();
    const exitTimeStr = formatLocalMySQLDateTime(exitTime);
    const { durationHours, amount } = calculateFare(activeTicket.entry_time, exitTime);

    // 5. Update slots to unoccupied
    if (activeTicket.slot_number) {
      await connection.query(
        'UPDATE slots SET is_occupied = FALSE WHERE slot_number = ?',
        [activeTicket.slot_number]
      );
    }

    // 6. Update ticket status
    await connection.query(
      'UPDATE tickets SET exit_time = ?, amount = ?, status = ? WHERE id = ?',
      [exitTimeStr, amount, 'exited', activeTicket.id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      receipt: {
        ticketId: activeTicket.ticket_id,
        vehicleNumber: activeTicket.vehicle_number,
        entryTime: activeTicket.entry_time,
        exitTime: exitTimeStr,
        durationHours,
        amount,
        slotNumber: activeTicket.slot_number,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/parked
 * Returns list of all currently parked vehicles.
 */
exports.getParkedVehicles = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT id, ticket_id, vehicle_number, vehicle_type, entry_time, status, slot_number FROM tickets WHERE status = 'parked' ORDER BY entry_time DESC"
    );
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};
