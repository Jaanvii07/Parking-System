import React from 'react';

/**
 * Reusable loading spinner.
 * Supports inline or overlay layout.
 * 
 * @param {Object} props
 * @param {boolean} props.overlay - Renders as a full screen blocking overlay.
 */
function Loader({ overlay = false }) {
  if (overlay) {
    return (
      <div className="overlay-loader" id="loader-overlay">
        <div className="overlay-spinner"></div>
      </div>
    );
  }

  return (
    <div className="spinner-container" id="loader-inline">
      <div className="spinner"></div>
    </div>
  );
}

export default Loader;
