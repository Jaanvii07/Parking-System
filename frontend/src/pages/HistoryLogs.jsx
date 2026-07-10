import React, { useState, useEffect } from 'react';
import { getHistory, deleteTicket } from '../services/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function HistoryLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id, ticketId) => {
    if (!window.confirm(`Delete ticket record ${ticketId}?`)) return;
    setDeletingId(id);
    setMsg('');
    try {
      const data = await deleteTicket(id);
      if (data.success) {
        setMsg(`Record ${ticketId} deleted.`);
        fetchLogs();
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter and search
  const visible = logs.filter(log => {
    if (filter !== 'all' && log.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.ticket_id.toLowerCase().includes(q) ||
      log.vehicle_number.toLowerCase().includes(q) ||
      log.vehicle_type.toLowerCase().includes(q) ||
      (log.slot_number && log.slot_number.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Search + filter bar */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search by ticket, vehicle number, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="history-search"
          />
        </div>
        <select
          className="filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          id="history-filter"
        >
          <option value="all">All Records</option>
          <option value="parked">Parked</option>
          <option value="exited">Exited</option>
        </select>
        <button className="btn btn-ghost" onClick={fetchLogs} id="history-refresh-btn">
          ↻ Refresh
        </button>
      </div>

      {msg && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          ℹ️ {msg}
        </div>
      )}

      <div className="card" id="history-table-card">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner"></div></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Records Found</h3>
            <p>
              {search || filter !== 'all'
                ? 'Try changing your search or filter.'
                : 'Parking history will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" id="history-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Vehicle No.</th>
                  <th>Type</th>
                  <th>Slot</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(log => (
                  <tr key={log.id} id={`history-row-${log.id}`}>
                    <td className="ticket-id-cell">{log.ticket_id}</td>
                    <td className="vehicle-num-cell">{log.vehicle_number}</td>
                    <td>
                      <span className={`badge badge-${log.vehicle_type}`}>
                        {log.vehicle_type}
                      </span>
                    </td>
                    <td>
                      {log.slot_number
                        ? <span className="slot-badge">{log.slot_number}</span>
                        : <span className="time-cell">—</span>}
                    </td>
                    <td className="time-cell">{fmt(log.entry_time)}</td>
                    <td className="time-cell">{fmt(log.exit_time)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {log.amount != null ? `₹${parseFloat(log.amount).toFixed(2)}` : '—'}
                    </td>
                    <td>
                      {log.status === 'parked'
                        ? <span className="status-parked">Active</span>
                        : <span className="status-exited">✓ Exited</span>}
                    </td>
                    <td>
                      {log.status === 'exited' ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(log.id, log.ticket_id)}
                          disabled={deletingId === log.id}
                          id={`del-ticket-${log.id}`}
                        >
                          {deletingId === log.id ? '...' : 'Delete'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryLogs;
