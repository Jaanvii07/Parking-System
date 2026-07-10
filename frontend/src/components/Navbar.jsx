import React from 'react';

/**
 * Navbar component that displays application header and real-time total occupancy.
 * 
 * @param {Object} props
 * @param {Object} props.slots - Slots occupancy data { bike: {total, available}, ... }
 */
function Navbar({ slots = {} }) {
  // Compute total occupied and capacity slots dynamically
  const occupiedCount = Object.values(slots).reduce(
    (sum, item) => sum + (item.total - item.available),
    0
  );
  const totalCount = Object.values(slots).reduce((sum, item) => sum + item.total, 0);

  return (
    <nav className="navbar" id="navbar">
      <div className="brand-section">
        <h1>🅿️ Parking Lot Management</h1>
        <p>Real-time slot allocation and automated billing</p>
      </div>
      <div className="occupancy-badge" id="occupancy-badge">
        <span className="occupancy-dot"></span>
        <span>{occupiedCount} of {totalCount} slots occupied</span>
      </div>
    </nav>
  );
}

export default Navbar;
