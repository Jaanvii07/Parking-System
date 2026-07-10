-- Schema for Parking Lot Management System
CREATE DATABASE IF NOT EXISTS parking_lot;
USE parking_lot;

-- Slots table to track occupancy and assignment
CREATE TABLE IF NOT EXISTS slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_type ENUM('bike', 'car', 'truck') NOT NULL,
    slot_number VARCHAR(10) UNIQUE NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE
);

-- Tickets table to store parking logs
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
);

-- Seed slots if empty
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'bike', 'B-1', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'B-1');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'bike', 'B-2', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'B-2');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'bike', 'B-3', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'B-3');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'bike', 'B-4', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'B-4');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'bike', 'B-5', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'B-5');

INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'car', 'C-1', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'C-1');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'car', 'C-2', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'C-2');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'car', 'C-3', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'C-3');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'car', 'C-4', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'C-4');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'car', 'C-5', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'C-5');

INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'truck', 'T-1', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'T-1');
INSERT INTO slots (slot_type, slot_number, is_occupied)
SELECT 'truck', 'T-2', FALSE WHERE NOT EXISTS (SELECT 1 FROM slots WHERE slot_number = 'T-2');
