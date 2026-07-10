import React, { useState } from 'react';
import { parkVehicle } from '../services/api';
import TicketCard from './TicketCard';
import Loader from './Loader';

/**
 * Form to register a new vehicle entry.
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback triggered after successful parking.
 */
function ParkVehicleForm({ onSuccess }) {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successTicket, setSuccessTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous results
    setError(null);
    setSuccessTicket(null);

    // Basic frontend validation
    if (!vehicleNumber.trim()) {
      setError('Vehicle number is required.');
      return;
    }
    if (!vehicleType) {
      setError('Please select a vehicle type.');
      return;
    }

    setLoading(true);

    try {
      const data = await parkVehicle(vehicleNumber.trim().toUpperCase(), vehicleType);
      if (data.success) {
        setSuccessTicket(data.ticket);
        setVehicleNumber('');
        setVehicleType('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Failed to park vehicle.');
      }
    } catch (err) {
      console.error('Error parking vehicle:', err);
      const msg = err.response?.data?.message || 'Server error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card" id="park-vehicle-card">
      <div className="form-header">
        <h2>Park a Vehicle</h2>
        <p>Generates a ticket and allocates an available slot</p>
      </div>

      <form onSubmit={handleSubmit} id="park-vehicle-form">
        {error && (
          <div className="alert alert-error" id="park-error-alert">
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="vehicleNumberInput">Vehicle Number</label>
          <input
            type="text"
            id="vehicleNumberInput"
            className="form-input"
            placeholder="e.g., KA01AB1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="vehicleTypeSelect">Vehicle Type</label>
          <select
            id="vehicleTypeSelect"
            className="form-select"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Type</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="truck">Truck</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="park-submit-btn"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Ticket'}
        </button>
      </form>

      {loading && <Loader />}

      {successTicket && (
        <div className="result-container" id="park-success-result">
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            🎉 Ticket generated successfully!
          </div>
          <TicketCard ticket={successTicket} />
        </div>
      )}
    </div>
  );
}

export default ParkVehicleForm;
