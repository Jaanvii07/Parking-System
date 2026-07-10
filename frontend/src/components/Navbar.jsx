import React from 'react';

// Sidebar component with navigation links
// Props: activePage (string), onPageChange (function), slots (object)
function Navbar({ activePage, onPageChange, slots = {} }) {
  const totalOccupied = Object.values(slots).reduce(
    (sum, s) => sum + (s.total - s.available),
    0
  );
  const totalCapacity = Object.values(slots).reduce((sum, s) => sum + s.total, 0);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
      )
    },
    {
      id: 'slots',
      label: 'Slot Manager',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      )
    },
    {
      id: 'history',
      label: 'Parking Logs',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    }
  ];

  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand logo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C8 2 5 5 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-text">ParkEase</div>
            <div className="sidebar-logo-sub">Management System</div>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Main</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
            id={`nav-${item.id}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Live occupancy counter */}
      <div className="sidebar-footer">
        <div className="sidebar-occupancy">
          <div className="sidebar-occupancy-label">
            <span className="live-dot"></span> Live Occupancy
          </div>
          <div className="sidebar-occupancy-count">{totalOccupied}</div>
          <div className="sidebar-occupancy-sub">of {totalCapacity} slots used</div>
        </div>
      </div>
    </aside>
  );
}

export default Navbar;
