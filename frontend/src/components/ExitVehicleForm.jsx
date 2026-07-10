import React, { useState } from 'react';
import { exitVehicle } from '../services/api';
import ReceiptCard from './ReceiptCard';
import Loader from './Loader';

/**
 * Form to process the exit of a parked vehicle.
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback triggered after successful exit.
 */
function ExitVehicleForm({ onSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setReceipt(null);

    if (!identifier.trim()) {
      setError('Please enter a Ticket ID or Vehicle Number.');
      return;
    }

    setLoading(true);

    try {
      const data = await exitVehicle(identifier.trim());
      if (data.success) {
        setReceipt(data.receipt);
        setIdentifier('');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Failed to exit vehicle.');
      }
    } catch (err) {
      console.error('Error exiting vehicle:', err);
      const msg = err.response?.data?.message || 'Server error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card" id="exit-vehicle-card">
      <div className="form-header">
        <h2>Exit a Vehicle</h2>
        <p>Calculates the parking fare and releases the occupied slot</p>
      </div>

      <form onSubmit={handleSubmit} id="exit-vehicle-form">
        {error && (
          <div className="alert alert-error" id="exit-error-alert">
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="exitIdentifierInput">Ticket ID or Vehicle Number</label>
          <input
            type="text"
            id="exitIdentifierInput"
            className="form-input"
            placeholder="e.g., TKT-1001 or KA01AB1234"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="exit-submit-btn"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Exit and Calculate Fare'}
        </button>
      </form>

      {loading && <Loader />}

      {receipt && (
        <div className="result-container" id="exit-success-result">
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            💸 Fare paid and vehicle exited!
          </div>
          <ReceiptCard receipt={receipt} />
        </div>
      )}
    </div>
  );
}

export default ExitVehicleForm;
