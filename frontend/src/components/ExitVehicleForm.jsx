import React, { useState } from 'react';
import { exitVehicle } from '../services/api';
import ReceiptCard from './ReceiptCard';

function ExitVehicleForm({ onSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setReceipt(null);

    if (!identifier.trim()) {
      setError('Enter a Ticket ID (e.g. TKT-1001) or Vehicle Number.');
      return;
    }

    setLoading(true);
    try {
      const data = await exitVehicle(identifier.trim());
      if (data.success) {
        setReceipt(data.receipt);
        setIdentifier('');
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Failed to process exit.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card" id="exit-form-card">
      <div className="form-card-header">
        <div className="form-card-icon exit">🚪</div>
        <div>
          <div className="form-card-title">Exit Vehicle</div>
          <div className="form-card-desc">Calculates fare and frees the slot</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} id="exit-vehicle-form">
        {error && (
          <div className="alert alert-error" id="exit-error">
            ⚠️ {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="exitIdentifier">Ticket ID or Vehicle Number</label>
          <input
            id="exitIdentifier"
            type="text"
            className="form-input"
            placeholder="e.g., TKT-1001 or KA01AB1234"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          id="exit-submit-btn"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Exit & Calculate Fare'}
        </button>
      </form>

      {receipt && (
        <div className="result-box" id="exit-result">
          <div className="alert alert-success" style={{ marginBottom: '0.75rem' }}>
            💸 Vehicle exited. Fare collected!
          </div>
          <ReceiptCard receipt={receipt} />
        </div>
      )}
    </div>
  );
}

export default ExitVehicleForm;
