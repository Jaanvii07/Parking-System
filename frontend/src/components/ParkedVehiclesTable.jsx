import React from 'react';

/**
 * Table component listing all currently parked vehicles in the lot.
 * 
 * @param {Object} props
 * @param {Array} props.vehicles - Array of parked vehicle objects
 * @param {boolean} props.loading - Indicates if data is currently being fetched
 */
function ParkedVehiclesTable({ vehicles = [], loading = false }) {
  
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="card table-section" id="parked-vehicles-section">
      <div className="table-header">
        <h2>Currently Parked Vehicles</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {vehicles.length} active vehicle{vehicles.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '2rem 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state" id="parked-empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No Vehicles Parked</h3>
          <p>New parked vehicles will appear here in real-time.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="vehicles-table" id="parked-vehicles-table">
            <thead>
              <tr>
                <th>Slot</th>
                <th>Ticket ID</th>
                <th>Vehicle Number</th>
                <th>Type</th>
                <th>Entry Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} id={`row-${v.ticket_id}`}>
                  <td>
                    <span className="slot-badge">{v.slot_number || 'N/A'}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {v.ticket_id}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {v.vehicle_number}
                  </td>
                  <td>
                    <span className={`type-badge ${v.vehicle_type}`}>
                      {v.vehicle_type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {formatDate(v.entry_time)}
                  </td>
                  <td>
                    <span className="status-indicator-parked">Parked</span>
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
