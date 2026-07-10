const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/parkingController');

// Slot availability stats (for dashboard cards)
router.get('/slots', ctrl.getSlots);

// Slot CRUD (for slot manager page)
router.get('/slots/list', ctrl.getAllSlots);
router.post('/slots', ctrl.createSlot);
router.delete('/slots/:id', ctrl.deleteSlot);

// Vehicle parking and exit
router.post('/park', ctrl.parkVehicle);
router.post('/exit', ctrl.exitVehicle);

// Currently parked list
router.get('/parked', ctrl.getParkedVehicles);

// Parking history logs + delete
router.get('/history', ctrl.getHistory);
router.delete('/tickets/:id', ctrl.deleteTicket);

module.exports = router;

