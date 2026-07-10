import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AvailabilityCards from '../components/AvailabilityCards';
import ParkVehicleForm from '../components/ParkVehicleForm';
import ExitVehicleForm from '../components/ExitVehicleForm';
import ParkedVehiclesTable from '../components/ParkedVehiclesTable';
import { getSlots, getParkedVehicles } from '../services/api';

/**
 * Main dashboard page orchestrating state management and child components.
 */
function Dashboard() {
  const [slots, setSlots] = useState({
    bike: { total: 5, available: 5 },
    car: { total: 5, available: 5 },
    truck: { total: 2, available: 2 },
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to load slots and parked vehicles list concurrently
  const loadDashboardData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [slotsData, vehiclesData] = await Promise.all([
        getSlots(),
        getParkedVehicles()
      ]);
      setSlots(slotsData);
      setVehicles(vehiclesData);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Connection to backend failed. Please check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    loadDashboardData(true);
  }, []);

  // Callback to refresh dashboard data after park/exit actions
  const handleActionSuccess = () => {
    loadDashboardData(false); // Silent reload without full blocking spinner
  };

  return (
    <div className="dashboard-container" id="dashboard-wrapper">
      {/* Global connection error warning banner */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 0 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Top Navigation */}
      <Navbar slots={slots} />

      {/* Availability Cards */}
      <AvailabilityCards slots={slots} />

      {/* Panel of Actions */}
      <div className="action-grid">
        <ParkVehicleForm onSuccess={handleActionSuccess} />
        <ExitVehicleForm onSuccess={handleActionSuccess} />
      </div>

      {/* Currently Parked List */}
      <ParkedVehiclesTable vehicles={vehicles} loading={loading} />
    </div>
  );
}

export default Dashboard;
