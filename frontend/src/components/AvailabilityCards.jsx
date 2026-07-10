import React from 'react';

/**
 * Renders occupancy status cards for Bike, Car, and Truck parking.
 * 
 * @param {Object} props
 * @param {Object} props.slots - Slots occupancy data { bike: {total, available}, ... }
 */
function AvailabilityCards({ slots = {} }) {
  const vehicleTypes = [
    { key: 'bike', label: 'Bikes' },
    { key: 'car', label: 'Cars' },
    { key: 'truck', label: 'Trucks' },
  ];

  return (
    <div className="availability-grid" id="availability-cards-grid">
      {vehicleTypes.map((vehicle) => {
        const data = slots[vehicle.key] || { total: 0, available: 0 };
        const { total, available } = data;
        const occupied = total - available;
        const isFull = available === 0;
        
        // Calculate progress percentage of occupancy
        const occupancyPercentage = total > 0 ? (occupied / total) * 100 : 0;

        return (
          <div key={vehicle.key} className="card availability-card" id={`card-${vehicle.key}`}>
            <div className="card-header">
              <span className="card-type-title">
                <span className={`type-indicator ${vehicle.key}`}></span>
                {vehicle.label}
              </span>
              <span className={`status-badge ${isFull ? 'full' : 'available'}`}>
                {isFull ? 'Full' : 'Open'}
              </span>
            </div>

            <div className="availability-count-section">
              {isFull ? (
                <span className="available-number" style={{ color: 'var(--danger)' }}>Full</span>
              ) : (
                <>
                  <span className="available-number">{available}</span>
                  <span className="total-number">/{total} free</span>
                </>
              )}
            </div>

            <div className="progress-container">
              <div
                className={`progress-bar ${vehicle.key} ${isFull ? 'full' : ''}`}
                style={{ width: `${occupancyPercentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AvailabilityCards;
