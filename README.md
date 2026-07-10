# Parking Lot Management System

A production-ready, high-fidelity Parking Lot Management System built using **React (Vite)** on the frontend, **Node.js (Express)** on the backend, and **MySQL** for database storage. 

This system handles real-time slot allocation, generates individual tickets upon parking, updates slot availability dynamically using transactions, calculates tiered pricing charges upon vehicle exit, and records comprehensive parking logs.

---

## Folder Structure

The application is structured into modular sections for the frontend and backend:

```text
Parking System/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL pool connection and auto-migrations
│   ├── controllers/
│   │   └── parkingController.js  # Main route logic (parking/exiting transactions, validations)
│   ├── middlewares/
│   │   └── errorHandler.js       # Centralized global Express error handler
│   ├── routes/
│   │   └── parkingRoutes.js      # REST API route endpoints
│   ├── utils/
│   │   ├── fareCalculator.js     # Tiered price rounding calculations
│   │   └── ticketGenerator.js    # Concurrency-safe ticket serial number builder
│   ├── .env.example              # Environment variables template
│   ├── .env                      # Custom environment settings (locally generated)
│   ├── package.json              # Backend script commands and dependency mapping
│   └── server.js                 # App bootstrapper
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AvailabilityCards.jsx   # Linear progress indicator cards for slot statuses
│   │   │   ├── ExitVehicleForm.jsx     # Card handling vehicle exits & receipt displays
│   │   │   ├── Loader.jsx              # Loading spinner overlays and inline indicators
│   │   │   ├── Navbar.jsx              # Dashboard banner & global occupancy count
│   │   │   ├── ParkedVehiclesTable.jsx # Clean data table showing current parked vehicles
│   │   │   ├── ParkVehicleForm.jsx     # Card handling vehicle entry & ticket displays
│   │   │   ├── ReceiptCard.jsx         # Styled invoice receipts highlighting total fares
│   │   │   └── TicketCard.jsx          # Styled virtual parking tickets with barcodes
│   │   ├── pages/
│   │   │   └── Dashboard.jsx           # Main page coordinating API sync & components
│   │   ├── services/
│   │   │   └── api.js                  # Centralized Axios services configuration
│   │   ├── styles/
│   │   │   └── App.css                 # Custom CSS stylesheet with variables & transitions
│   │   ├── App.jsx                     # Entry wrapper
│   │   └── main.jsx                    # React mounting module
│   ├── index.html                      # HTML template with Outfit/Inter Google fonts
│   ├── vite.config.js                  # Vite server & local dev proxy configurations
│   └── package.json                    # Frontend package dependencies configuration
│
├── schema.sql                          # Primary SQL schema file with initial seeding
└── README.md                           # Project documentation guide
```

---

## Technical Specifications & Business Rules

### 1. Slot Allocation Limits
The system maintains the following limits on the backend (`LIMITS` constant):
- **Bike**: 5 slots (`B-1` to `B-5`)
- **Car**: 6 slots (`C-1` to `C-5`)
- **Truck**: 2 slots (`T-1` to `T-2`)

*Note: Limits are not hardcoded inside database columns; availability is calculated dynamically using SQL queries.*

### 2. Pricing Tiers
Fees are calculated based on entry and exit times. Hours are rounded **UP** to the nearest whole integer (minimum 1 hour):
- **1 to 3 hours**: ₹30
- **4 to 6 hours**: ₹85
- **7+ hours**: ₹120

### 3. Database Schema
The MySQL database is named `parking_lot`. It contains two tables:
- `slots`: tracks `id`, `slot_type`, `slot_number` (unique), and `is_occupied`.
- `tickets`: stores `id`, unique `ticket_id` (e.g. `TKT-1001`), `vehicle_number`, `vehicle_type`, `entry_time`, `exit_time`, `amount`, `status` ('parked'/'exited'), and `slot_number`.

---

## Setup & Installation

### Step 1: Pre-requisites
- Ensure [Node.js](https://nodejs.org/) (v16.0.0 or higher) is installed.
- Ensure [MySQL Server](https://www.mysql.com/) is running locally on your computer.

### Step 2: Database Creation
Open your MySQL client or command-line interface and execute:
```sql
CREATE DATABASE IF NOT EXISTS parking_lot;
```
*(Optionally, you can run the contents of [schema.sql](schema.sql) in your database client, or let the backend do it automatically on startup).*

### Step 3: Configure Environment Variables
Navigate to the `backend/` directory and copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Update `.env` with your MySQL server credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=parking_lot
```

### Step 4: Install Dependencies & Run

#### Run the Backend Server
```bash
# From the project root:
cd backend
npm install
npm run dev
```
The server will automatically initialize the `tickets` and `slots` tables and seed them with the 12 initial slots if empty, then start listening on port `5000`.

#### Run the Frontend Dashboard
```bash
# Open a new terminal window at the project root:
cd frontend
npm install
npm run dev
```
The Vite development server will start, typically hosting the app on `http://localhost:3000`. Open this URL in your web browser to use the dashboard.

---

## REST API Documentation

### 1. Get Slots Occupancy Status
* **Endpoint**: `GET /api/slots`
* **Response**: `200 OK`
```json
{
  "bike": { "total": 5, "available": 3 },
  "car": { "total": 5, "available": 2 },
  "truck": { "total": 2, "available": 1 }
}
```

### 2. Park a Vehicle
* **Endpoint**: `POST /api/park`
* **Request Payload**:
```json
{
  "vehicleNumber": "KA01AB1234",
  "vehicleType": "car"
}
```
* **Success Response (`201 Created`)**:
```json
{
  "success": true,
  "ticket": {
    "ticketId": "TKT-1001",
    "vehicleNumber": "KA01AB1234",
    "vehicleType": "car",
    "entryTime": "2026-07-09 11:45:00",
    "slotNumber": "C-1"
  }
}
```
* **Conflict Errors (`409 Conflict`)**:
  * Parking limit exceeded: `{"success": false, "message": "Parking Full"}`
  * Vehicle already parked: `{"success": false, "message": "Vehicle KA01AB1234 is already parked at slot C-1."}`

### 3. Exit a Vehicle
* **Endpoint**: `POST /api/exit`
* **Request Payload** (accepts either ticketId or vehicleNumber):
```json
{
  "ticketId": "TKT-1001"
}
```
*or*
```json
{
  "vehicleNumber": "KA01AB1234"
}
```
* **Success Response (`200 OK`)**:
```json
{
  "success": true,
  "receipt": {
    "ticketId": "TKT-1001",
    "vehicleNumber": "KA01AB1234",
    "entryTime": "2026-07-09 08:45:00",
    "exitTime": "2026-07-09 11:55:00",
    "durationHours": 4,
    "amount": 85.00,
    "slotNumber": "C-1"
  }
}
```
* **Errors**:
  * Active ticket not found: `404 Not Found`
  * Vehicle already exited: `400 Bad Request`

### 4. Get Parked Vehicles
* **Endpoint**: `GET /api/parked`
* **Response (`200 OK`)**: Returns an array of currently parked vehicles.
```json
[
  {
    "id": 1,
    "ticket_id": "TKT-1001",
    "vehicle_number": "KA01AB1234",
    "vehicle_type": "car",
    "entry_time": "2026-07-09T08:45:00.000Z",
    "status": "parked",
    "slot_number": "C-1"
  }
]
```

---

## Future Improvements
1. **Receipt Archive**: Add history lookup logs to view previous transactions.
2. **Dynamic Rates Editor**: Implement UI settings to adjust tiered pricing on the fly.
3. **Multi-lot Support**: Expand the schema to cover multiple parking locations.
