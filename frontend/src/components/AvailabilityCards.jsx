import React from 'react';

// Shows 3 stat cards: Bikes, Cars, Trucks
// Displays available vs total, with a progress bar
function AvailabilityCards({ slots = {} }) {
  const types = [
    { key: 'bike', label: 'Bikes', emoji: '🏍️' },
    { key: 'car', label: 'Cars', emoji: '🚗' },
    { key: 'truck', label: 'Trucks', emoji: '🚛' }
  ];

  return (
    <div className="stat-grid" id="stats-grid">
      {types.map(t => {
        const data = slots[t.key] || { total: 0, available: 0 };
        const occupied = data.total - data.available;
        const isFull = data.available === 0;
        const pct = data.total > 0 ? (occupied / data.total) * 100 : 0;

        return (
          <div key={t.key} className="card stat-card" id={`stat-${t.key}`}>
            <div className="stat-card-top">
              <div className={`stat-card-icon ${t.key}`}>
                <span>{t.emoji}</span>
              </div>
              <span className={`stat-card-badge ${isFull ? 'full' : 'available'}`}>
                {isFull ? 'Full' : 'Open'}
              </span>
            </div>

            <div className="stat-card-title">{t.label}</div>

            {isFull ? (
              <div className="stat-card-number full">Full</div>
            ) : (
              <div className={`stat-card-number ${t.key}`}>{data.available}</div>
            )}

            <div className="stat-card-sub">
              {occupied} occupied · {data.available} free of {data.total}
            </div>

            <div className="stat-progress">
              <div
                className={`stat-progress-bar ${isFull ? 'full' : t.key}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AvailabilityCards;
