import axios from 'axios';

// Base API configuration
const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get available and total slot counts for all vehicle types.
 */
export const getSlots = async () => {
  const response = await API.get('/slots');
  return response.data;
};

/**
 * Park a vehicle.
 * @param {string} vehicleNumber 
 * @param {string} vehicleType 
 */
export const parkVehicle = async (vehicleNumber, vehicleType) => {
  const response = await API.post('/park', { vehicleNumber, vehicleType });
  return response.data;
};

/**
 * Exit a vehicle by Ticket ID or Vehicle Number.
 * @param {string} identifier - Can be ticketId (e.g., TKT-1001) or vehicleNumber (e.g., KA01AB1234)
 */
export const exitVehicle = async (identifier) => {
  const cleanId = identifier.trim();
  const payload = {};
  
  // Intelligently check if it looks like a ticket ID (starts with TKT-) or vehicle number
  if (/^TKT-\d+/i.test(cleanId)) {
    payload.ticketId = cleanId;
  } else {
    payload.vehicleNumber = cleanId;
  }

  const response = await API.post('/exit', payload);
  return response.data;
};

/**
 * Get all currently parked vehicles.
 */
export const getParkedVehicles = async () => {
  const response = await API.get('/parked');
  return response.data;
};
