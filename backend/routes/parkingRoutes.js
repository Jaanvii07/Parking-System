const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Retrieve availability metrics for all vehicle slots
router.get('/slots', parkingController.getSlots);

// Park a new vehicle and generate a ticket
router.post('/park', parkingController.parkVehicle);

// Process the exit of a parked vehicle and calculate fare
router.post('/exit', parkingController.exitVehicle);

// Retrieve all currently parked vehicles
router.get('/parked', parkingController.getParkedVehicles);

module.exports = router;
