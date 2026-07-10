import React, { useState } from 'react';
import { parkVehicle } from '../services/api';
import TicketCard from './TicketCard';

function ParkVehicleForm({ onSuccess }) {
  const [vehicleNum, setVehicleNum] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTicket(null);

    // basic validation
    if (!vehicleNum.trim()) {
      setError('Please enter a vehicle number.');
      return;
    }
    if (!vehicleType) {
      setError('Please select the vehicle type.');
      return;
    }

    setLoading(true);
    try {
      const data = await parkVehicle(vehicleNum.trim().toUpperCase(), vehicleType);
      if (data.success) {
        setTicket(data.ticket);
        setVehicleNum('');
        setVehicleType('');
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Could not park vehicle.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card" id="park-form-card">
      <div className="form-card-header">
        <div className="form-card-icon park">🅿️</div>
        <div>
          <div className="form-card-title">Park a Vehicle</div>
          <div className="form-card-desc">Assigns a slot and generates a ticket</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="park-vehicle-form">
        {error && (
          <div className="alert alert-error" id="park-error">
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="parkVehicleNum">Vehicle Number</label>
          <input
            id="parkVehicleNum"
            type="text"
            className="form-input"
            placeholder="e.g., KA01AB1234"
            value={vehicleNum}
            onChange={e => setVehicleNum(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="parkVehicleType">Vehicle Type</label>
          <select
            id="parkVehicleType"
            className="form-select"
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select Type --</option>
            <option value="bike">🏍️ Bike</option>
            <option value="car">🚗 Car</option>
            <option value="truck">🚛 Truck</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          id="park-submit-btn"
          disabled={loading}
        >
          {loading ? 'Generating ticket...' : 'Generate Ticket'}
        </button>
      </form>

      {ticket && (
        <div className="result-box" id="park-result">
          <div className="alert alert-success" style={{ marginBottom: '0.75rem' }}>
            ✅ Vehicle parked successfully!
          </div>
          <TicketCard ticket={ticket} />
        </div>
      )}
    </div>
  );
}

export default ParkVehicleForm;
