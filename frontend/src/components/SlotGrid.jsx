import React from 'react';

// Visual grid of all parking slots — green = free, red = occupied
// Clicking a free slot fills in the park form (via onSlotClick)
function SlotGrid({ slots = [], onSlotClick }) {
  const bikes = slots.filter(s => s.slot_type === 'bike');
  const cars = slots.filter(s => s.slot_type === 'car');
  const trucks = slots.filter(s => s.slot_type === 'truck');

  const typeGroups = [
    { label: 'Bike Slots', items: bikes, emoji: '🏍️' },
    { label: 'Car Slots', items: cars, emoji: '🚗' },
    { label: 'Truck Slots', items: trucks, emoji: '🚛' }
  ];

  return (
    <div className="card slot-grid-section" id="slot-grid-card">
      <div className="slot-grid-header">
        <div>
          <div className="section-title">Parking Lot Overview</div>
          <div className="section-subtitle">Click a free slot to start parking</div>
        </div>
        <div className="slot-legend">
          <div className="legend-item">
            <div className="legend-dot free"></div>
            Available
          </div>
          <div className="legend-item">
            <div className="legend-dot occupied"></div>
            Occupied
          </div>
        </div>
      </div>

      {typeGroups.map(group => (
        <div key={group.label} className="slot-type-group">
          <div className="slot-type-label">
            {group.emoji} {group.label}
          </div>
          <div className="slot-cells">
            {group.items.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No slots available</span>
            ) : (
              group.items.map(slot => (
                <div
                  key={slot.id}
                  className={`slot-cell ${slot.is_occupied ? 'occupied' : 'free'}`}
                  onClick={() => !slot.is_occupied && onSlotClick && onSlotClick(slot)}
                  title={slot.is_occupied ? `Occupied — ${slot.slot_number}` : `Click to park here — ${slot.slot_number}`}
                  id={`slot-${slot.slot_number}`}
                >
                  <div className="slot-cell-icon">
                    {slot.is_occupied ? '🔴' : '🟢'}
                  </div>
                  <div className="slot-cell-number">{slot.slot_number}</div>
                  <div className="slot-cell-status">
                    {slot.is_occupied ? 'used' : 'free'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SlotGrid;
