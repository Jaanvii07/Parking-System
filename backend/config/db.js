const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'parking_lot';
let pool;

// Set up database and tables on startup
async function initializeDatabase() {
  let connection;
  try {
    // Connect to MySQL server first (without database name) to check if it exists
    connection = await mysql.createConnection(dbConfig);
    console.log('Successfully connected to MySQL database server.');

    // Create database if not already created
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" checked/created.`);

    // Select the database
    await connection.query(`USE \`${dbName}\``);

    // Create slots table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_type ENUM('bike', 'car', 'truck') NOT NULL,
        slot_number VARCHAR(10) UNIQUE NOT NULL,
        is_occupied BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('Checked slots table structure.');

    // Create tickets table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id VARCHAR(20) UNIQUE NOT NULL,
        vehicle_number VARCHAR(20) NOT NULL,
        vehicle_type ENUM('bike','car','truck') NOT NULL,
        entry_time DATETIME NOT NULL,
        exit_time DATETIME DEFAULT NULL,
        amount DECIMAL(6,2) DEFAULT NULL,
        status ENUM('parked','exited') DEFAULT 'parked',
        slot_number VARCHAR(10) DEFAULT NULL,
        FOREIGN KEY (slot_number) REFERENCES slots(slot_number) ON DELETE SET NULL
      )
    `);
    console.log('Checked tickets table structure.');

    // If slots table is empty, seed initial slots for testing
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM slots');
    if (rows[0].count === 0) {
      console.log('Seeding initial parking slots data...');
      const seedSlots = [
        // 5 Bike slots
        ['bike', 'B-1', false],
        ['bike', 'B-2', false],
        ['bike', 'B-3', false],
        ['bike', 'B-4', false],
        ['bike', 'B-5', false],
        // 5 Car slots
        ['car', 'C-1', false],
        ['car', 'C-2', false],
        ['car', 'C-3', false],
        ['car', 'C-4', false],
        ['car', 'C-5', false],
        // 2 Truck slots
        ['truck', 'T-1', false],
        ['truck', 'T-2', false]
      ];

      for (const [type, number, isOccupied] of seedSlots) {
        await connection.query(
          'INSERT INTO slots (slot_type, slot_number, is_occupied) VALUES (?, ?, ?)',
          [type, number, isOccupied]
        );
      }
      console.log('Initial slots seeded successfully!');
    } else {
      console.log('Parking slots already populated.');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // Create connection pool for the main app runtime
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log(`Database connection pool created for "${dbName}".`);
  return pool;
}

module.exports = {
  initializeDatabase,
  getPool: () => {
    if (!pool) {
      throw new Error('Database pool not initialized. Run initializeDatabase first.');
    }
    return pool;
  }
};

