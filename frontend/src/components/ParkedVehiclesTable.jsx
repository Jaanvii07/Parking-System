import React, { useState } from 'react';
import { exitVehicle } from '../services/api';

function fmt(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// Table showing currently parked vehicles with a quick-exit button per row
function ParkedVehiclesTable({ vehicles = [], loading = false, onRefresh }) {
  const [exitingId, setExitingId] = useState(null);
  const [exitError, setExitError] = useState('');

  const handleQuickExit = async (ticketId) => {
    setExitingId(ticketId);
    setExitError('');
    try {
      const data = await exitVehicle(ticketId);
      if (data.success && onRefresh) {
        onRefresh();
      } else if (!data.success) {
        setExitError(data.message || 'Failed to exit vehicle.');
      }
    } catch (err) {
      setExitError(err.response?.data?.message || 'Error processing exit.');
    } finally {
      setExitingId(null);
    }
  };

  return (
    <div className="card table-card" id="parked-vehicles-section">
      <div className="table-header">
        <div>
          <div className="section-title">Currently Parked</div>
          <div className="section-subtitle">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in the lot right now
          </div>
        </div>
      </div>

      {exitError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          ⚠️ {exitError}
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner"></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state" id="parked-empty">
          <div className="empty-state-icon">🏁</div>
          <h3>No Vehicles Parked</h3>
          <p>Parked vehicles will show up here as soon as they check in.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table" id="parked-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Ticket ID</th>
                <th>Vehicle No.</th>
                <th>Type</th>
                <th>Entry Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} id={`row-${v.ticket_id}`}>
                  <td>
                    <span className="slot-badge">{v.slot_number || '—'}</span>
                  </td>
                  <td className="ticket-id-cell">{v.ticket_id}</td>
                  <td className="vehicle-num-cell">{v.vehicle_number}</td>
                  <td>
                    <span className={`badge badge-${v.vehicle_type}`}>
                      {v.vehicle_type}
                    </span>
                  </td>
                  <td className="time-cell">{fmt(v.entry_time)}</td>
                  <td>
                    <span className="status-parked">Active</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleQuickExit(v.ticket_id)}
                      disabled={exitingId === v.ticket_id}
                      id={`exit-btn-${v.ticket_id}`}
                    >
                      {exitingId === v.ticket_id ? '...' : 'Exit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ParkedVehiclesTable;
