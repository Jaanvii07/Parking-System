import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Slot availability stats (used in dashboard cards)
export const getSlots = async () => {
  const res = await API.get('/slots');
  return res.data;
};

// Full list of all physical slots (for slot manager)
export const getAllSlots = async () => {
  const res = await API.get('/slots/list');
  return res.data;
};

export const createSlot = async (slotType, slotNumber) => {
  const res = await API.post('/slots', { slot_type: slotType, slot_number: slotNumber });
  return res.data;
};

export const deleteSlot = async (id) => {
  const res = await API.delete(`/slots/${id}`);
  return res.data;
};

// Park a vehicle
export const parkVehicle = async (vehicleNumber, vehicleType) => {
  const res = await API.post('/park', { vehicleNumber, vehicleType });
  return res.data;
};

// Exit by ticket ID or vehicle number
export const exitVehicle = async (identifier) => {
  const clean = identifier.trim();
  const payload = /^TKT-\d+/i.test(clean)
    ? { ticketId: clean }
    : { vehicleNumber: clean };

  const res = await API.post('/exit', payload);
  return res.data;
};

// Currently parked list
export const getParkedVehicles = async () => {
  const res = await API.get('/parked');
  return res.data;
};

// Full ticket history (parked + exited)
export const getHistory = async () => {
  const res = await API.get('/history');
  return res.data;
};

export const deleteTicket = async (id) => {
  const res = await API.delete(`/tickets/${id}`);
  return res.data;
};

