import React, { useState, useEffect } from 'react';
import { getAllSlots, createSlot, deleteSlot } from '../services/api';

function SlotManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMsg, setDeleteMsg] = useState('');

  const loadSlots = async () => {
    try {
      const data = await getAllSlots();
      setSlots(data);
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!newType || !newNumber.trim()) {
      setAddError('Both slot type and number are required.');
      return;
    }

    try {
      const data = await createSlot(newType, newNumber.trim());
      if (data.success) {
        setAddSuccess(data.message);
        setNewType('');
        setNewNumber('');
        loadSlots();
      } else {
        setAddError(data.message);
      }
    } catch (err) {
      setAddError(err.response?.data?.message || 'Could not add slot.');
    }
  };

  const handleDelete = async (id, slotNumber) => {
    if (!window.confirm(`Delete slot ${slotNumber}? This cannot be undone.`)) return;
    setDeletingId(id);
    setDeleteMsg('');
    try {
      const data = await deleteSlot(id);
      if (data.success) {
        setDeleteMsg(`Slot ${slotNumber} removed.`);
        loadSlots();
      }
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || 'Could not delete slot.');
    } finally {
      setDeletingId(null);
    }
  };

  // Group slots by type
  const bikes = slots.filter(s => s.slot_type === 'bike');
  const cars = slots.filter(s => s.slot_type === 'car');
  const trucks = slots.filter(s => s.slot_type === 'truck');

  const typeGroups = [
    { label: 'Bike Slots', items: bikes, emoji: '🏍️', key: 'bike' },
    { label: 'Car Slots', items: cars, emoji: '🚗', key: 'car' },
    { label: 'Truck Slots', items: trucks, emoji: '🚛', key: 'truck' }
  ];

  return (
    <div>
      {/* Add new slot */}
      <div className="add-slot-form" id="add-slot-form">
        <div className="form-group" style={{ flexShrink: 0 }}>
          <label htmlFor="newSlotType">Slot Type</label>
          <select
            id="newSlotType"
            className="form-select"
            value={newType}
            onChange={e => setNewType(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="bike">🏍️ Bike</option>
            <option value="car">🚗 Car</option>
            <option value="truck">🚛 Truck</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="newSlotNumber">Slot Number</label>
          <input
            id="newSlotNumber"
            type="text"
            className="form-input"
            placeholder="e.g., B-6 or C-6"
            value={newNumber}
            onChange={e => setNewNumber(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" style={{ width: 'auto', flexShrink: 0 }} onClick={handleAdd} id="add-slot-btn">
          + Add Slot
        </button>
      </div>

      {addError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {addError}</div>}
      {addSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✅ {addSuccess}</div>}
      {deleteMsg && <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>ℹ️ {deleteMsg}</div>}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner"></div></div>
      ) : (
        typeGroups.map(group => (
          <div key={group.key} className="slots-type-section">
            <div className="slots-type-title">
              {group.emoji} {group.label} ({group.items.length})
            </div>

            {group.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <p>No {group.label.toLowerCase()} yet. Add one above.</p>
              </div>
            ) : (
              <div className="slots-cards-grid">
                {group.items.map(slot => (
                  <div
                    key={slot.id}
                    className={`slot-mgr-card ${slot.is_occupied ? 'is-occupied' : ''}`}
                    id={`mgr-slot-${slot.slot_number}`}
                  >
                    <div className="slot-mgr-number">{slot.slot_number}</div>
                    <div className="slot-mgr-status">
                      {slot.is_occupied ? '● Occupied' : '○ Available'}
                    </div>
                    {!slot.is_occupied && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(slot.id, slot.slot_number)}
                        disabled={deletingId === slot.id}
                        id={`del-slot-${slot.id}`}
                        style={{ marginTop: '0.5rem' }}
                      >
                        {deletingId === slot.id ? '...' : 'Remove'}
                      </button>
                    )}
                    {slot.is_occupied && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--red)', marginTop: '0.25rem' }}>
                        Exit vehicle first
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default SlotManager;
