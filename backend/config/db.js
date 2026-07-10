const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const dbName = process.env.DB_NAME || 'parking_lot';

let pool;

async function initializeDatabase() {
  let connection;
  try {
    // 1. Connect without database to ensure it exists
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server for initialization...');

    // 2. Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" verified/created.`);

    // 3. Connect to the specific database
    await connection.query(`USE \`${dbName}\``);

    // 4. Create slots table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slot_type ENUM('bike', 'car', 'truck') NOT NULL,
        slot_number VARCHAR(10) UNIQUE NOT NULL,
        is_occupied BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('Slots table verified/created.');

    // 5. Create tickets table
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
    console.log('Tickets table verified/created.');

    // 6. Seed slots if empty
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM slots');
    if (rows[0].count === 0) {
      console.log('Seeding slots table...');
      const seedQueries = [
        // Bikes
        ['bike', 'B-1', false],
        ['bike', 'B-2', false],
        ['bike', 'B-3', false],
        ['bike', 'B-4', false],
        ['bike', 'B-5', false],
        // Cars
        ['car', 'C-1', false],
        ['car', 'C-2', false],
        ['car', 'C-3', false],
        ['car', 'C-4', false],
        ['car', 'C-5', false],
        // Trucks
        ['truck', 'T-1', false],
        ['truck', 'T-2', false]
      ];

      for (const [type, number, is_occupied] of seedQueries) {
        await connection.query(
          'INSERT INTO slots (slot_type, slot_number, is_occupied) VALUES (?, ?, ?)',
          [type, number, is_occupied]
        );
      }
      console.log('Slots table seeded successfully.');
    } else {
      console.log('Slots table already populated.');
    }

  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }

  // Create the standard runtime connection pool
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
      throw new Error('Database pool not initialized. Call initializeDatabase first.');
    }
    return pool;
  }
};
