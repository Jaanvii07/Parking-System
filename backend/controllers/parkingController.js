const { getPool } = require('../config/db');
const { generateTicketId } = require('../utils/ticketGenerator');
const { calculateFare } = require('../utils/fareCalculator');

// Max capacity per vehicle type
const SLOT_LIMITS = {
  bike: 5,
  car: 5,
  truck: 2
};

const VALID_TYPES = ['bike', 'car', 'truck'];

// Format a JS Date to MySQL DATETIME string in local time
function toMySQLDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// GET /api/slots - returns slot occupancy stats for the 3 vehicle types
exports.getSlots = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT vehicle_type, COUNT(*) as occupied FROM tickets WHERE status = 'parked' GROUP BY vehicle_type"
    );

    // Start with full availability then subtract occupied
    const result = {
      bike: { total: SLOT_LIMITS.bike, available: SLOT_LIMITS.bike },
      car: { total: SLOT_LIMITS.car, available: SLOT_LIMITS.car },
      truck: { total: SLOT_LIMITS.truck, available: SLOT_LIMITS.truck }
    };

    rows.forEach(row => {
      const type = row.vehicle_type;
      if (result[type]) {
        const count = parseInt(row.occupied, 10);
        result[type].available = Math.max(0, SLOT_LIMITS[type] - count);
      }
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/slots/list - returns all slots with their current status (for the slot manager page)
exports.getAllSlots = async (req, res, next) => {
  try {
    const pool = getPool();
    const [slots] = await pool.query('SELECT * FROM slots ORDER BY slot_type, slot_number ASC');
    res.status(200).json(slots);
  } catch (err) {
    next(err);
  }
};

// POST /api/slots - add a new parking slot
exports.createSlot = async (req, res, next) => {
  const { slot_type, slot_number } = req.body;

  if (!slot_type || !slot_number) {
    return res.status(400).json({ success: false, message: 'Slot type and slot number are required.' });
  }

  const type = slot_type.toLowerCase().trim();
  const number = slot_number.toUpperCase().trim();

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid slot type. Must be bike, car, or truck.' });
  }

  try {
    const pool = getPool();

    // Check if this slot number already exists
    const [existing] = await pool.query('SELECT id FROM slots WHERE slot_number = ?', [number]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Slot ${number} already exists.` });
    }

    await pool.query(
      'INSERT INTO slots (slot_type, slot_number, is_occupied) VALUES (?, ?, FALSE)',
      [type, number]
    );

    // Update limit since we now have a new slot
    if (SLOT_LIMITS[type] !== undefined) {
      SLOT_LIMITS[type]++;
    }

    res.status(201).json({ success: true, message: `Slot ${number} added successfully.` });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/slots/:id - remove a parking slot (only if it's not occupied)
exports.deleteSlot = async (req, res, next) => {
  const slotId = req.params.id;

  try {
    const pool = getPool();

    const [rows] = await pool.query('SELECT * FROM slots WHERE id = ?', [slotId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    const slot = rows[0];
    if (slot.is_occupied) {
      return res.status(409).json({ success: false, message: `Cannot delete slot ${slot.slot_number} while it is occupied.` });
    }

    await pool.query('DELETE FROM slots WHERE id = ?', [slotId]);

    // Also reduce limit count
    if (SLOT_LIMITS[slot.slot_type] !== undefined && SLOT_LIMITS[slot.slot_type] > 0) {
      SLOT_LIMITS[slot.slot_type]--;
    }

    res.status(200).json({ success: true, message: `Slot ${slot.slot_number} deleted.` });
  } catch (err) {
    next(err);
  }
};

// POST /api/park - park a vehicle and generate a ticket
exports.parkVehicle = async (req, res, next) => {
  const { vehicleNumber, vehicleType } = req.body;

  if (!vehicleNumber || !vehicleType) {
    return res.status(400).json({ success: false, message: 'Vehicle number and vehicle type are required.' });
  }

  const type = vehicleType.toLowerCase().trim();
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid vehicle type. Choose from bike, car, or truck." });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Check if vehicle is already parked
    const [alreadyParked] = await conn.query(
      "SELECT slot_number FROM tickets WHERE vehicle_number = ? AND status = 'parked'",
      [vehicleNumber]
    );

    if (alreadyParked.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Vehicle ${vehicleNumber} is already parked at slot ${alreadyParked[0].slot_number}.`
      });
    }

    // Check capacity
    const [countRows] = await conn.query(
      "SELECT COUNT(*) as count FROM tickets WHERE vehicle_type = ? AND status = 'parked'",
      [type]
    );
    if (parseInt(countRows[0].count) >= SLOT_LIMITS[type]) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Parking lot is full for this vehicle type.' });
    }

    // Find a free slot
    const [freeSlots] = await conn.query(
      'SELECT * FROM slots WHERE slot_type = ? AND is_occupied = FALSE ORDER BY slot_number ASC LIMIT 1 FOR UPDATE',
      [type]
    );

    if (freeSlots.length === 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'No available slots for this vehicle type.' });
    }

    const slot = freeSlots[0];

    // Mark slot as occupied
    await conn.query('UPDATE slots SET is_occupied = TRUE WHERE id = ?', [slot.id]);

    // Generate ticket and record entry
    const ticketId = await generateTicketId(conn);
    const entryTime = toMySQLDateTime(new Date());

    await conn.query(
      'INSERT INTO tickets (ticket_id, vehicle_number, vehicle_type, entry_time, slot_number, status) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, vehicleNumber, type, entryTime, slot.slot_number, 'parked']
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      ticket: {
        ticketId,
        vehicleNumber,
        vehicleType: type,
        entryTime,
        slotNumber: slot.slot_number
      }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// POST /api/exit - process vehicle exit and calculate fare
exports.exitVehicle = async (req, res, next) => {
  const { ticketId, vehicleNumber } = req.body;

  if (!ticketId && !vehicleNumber) {
    return res.status(400).json({ success: false, message: 'Provide either a ticket ID or vehicle number.' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Look up active ticket
    let ticket = null;
    if (ticketId) {
      const [rows] = await conn.query("SELECT * FROM tickets WHERE ticket_id = ? AND status = 'parked'", [ticketId]);
      if (rows.length > 0) ticket = rows[0];
    } else {
      const [rows] = await conn.query("SELECT * FROM tickets WHERE vehicle_number = ? AND status = 'parked'", [vehicleNumber]);
      if (rows.length > 0) ticket = rows[0];
    }

    if (!ticket) {
      // Check if it's already exited or truly not found
      const lookupVal = ticketId || vehicleNumber;
      const lookupCol = ticketId ? 'ticket_id' : 'vehicle_number';
      const [anyRows] = await conn.query(
        `SELECT status FROM tickets WHERE ${lookupCol} = ? ORDER BY entry_time DESC LIMIT 1`,
        [lookupVal]
      );
      await conn.rollback();

      if (anyRows.length > 0 && anyRows[0].status === 'exited') {
        return res.status(400).json({ success: false, message: 'This vehicle has already exited.' });
      }
      return res.status(404).json({ success: false, message: 'No active parking ticket found.' });
    }

    const exitTime = new Date();
    const exitTimeStr = toMySQLDateTime(exitTime);
    const { durationHours, amount } = calculateFare(ticket.entry_time, exitTime);

    // Free up the slot
    if (ticket.slot_number) {
      await conn.query('UPDATE slots SET is_occupied = FALSE WHERE slot_number = ?', [ticket.slot_number]);
    }

    // Update ticket record
    await conn.query(
      'UPDATE tickets SET exit_time = ?, amount = ?, status = ? WHERE id = ?',
      [exitTimeStr, amount, 'exited', ticket.id]
    );

    await conn.commit();

    res.status(200).json({
      success: true,
      receipt: {
        ticketId: ticket.ticket_id,
        vehicleNumber: ticket.vehicle_number,
        vehicleType: ticket.vehicle_type,
        entryTime: ticket.entry_time,
        exitTime: exitTimeStr,
        durationHours,
        amount,
        slotNumber: ticket.slot_number
      }
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// GET /api/parked - list of all currently parked vehicles
exports.getParkedVehicles = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT id, ticket_id, vehicle_number, vehicle_type, entry_time, status, slot_number FROM tickets WHERE status = 'parked' ORDER BY entry_time DESC"
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

// GET /api/history - all tickets (both parked and exited) for the logs page
exports.getHistory = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, ticket_id, vehicle_number, vehicle_type, entry_time, exit_time, amount, status, slot_number FROM tickets ORDER BY entry_time DESC'
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tickets/:id - delete a ticket record from logs
exports.deleteTicket = async (req, res, next) => {
  const ticketId = req.params.id;
  try {
    const pool = getPool();

    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (rows[0].status === 'parked') {
      return res.status(409).json({ success: false, message: 'Cannot delete an active parking ticket. Exit the vehicle first.' });
    }

    await pool.query('DELETE FROM tickets WHERE id = ?', [ticketId]);
    res.status(200).json({ success: true, message: 'Ticket record deleted.' });
  } catch (err) {
    next(err);
  }
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
