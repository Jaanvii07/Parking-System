import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AvailabilityCards from '../components/AvailabilityCards';
import ParkVehicleForm from '../components/ParkVehicleForm';
import ExitVehicleForm from '../components/ExitVehicleForm';
import ParkedVehiclesTable from '../components/ParkedVehiclesTable';
import SlotGrid from '../components/SlotGrid';
import SlotManager from './SlotManager';
import HistoryLogs from './HistoryLogs';
import { getSlots, getParkedVehicles, getAllSlots } from '../services/api';

function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard');
  const [slots, setSlots] = useState({
    bike: { total: 5, available: 5 },
    car: { total: 5, available: 5 },
    truck: { total: 2, available: 2 }
  });
  const [allSlots, setAllSlots] = useState([]);
  const [parked, setParked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState('');

  // fetch all dashboard data from the API
  const loadData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const [slotsData, parkedData, allSlotsData] = await Promise.all([
        getSlots(),
        getParkedVehicles(),
        getAllSlots()
      ]);
      setSlots(slotsData);
      setParked(parkedData);
      setAllSlots(allSlotsData);
      setConnError('');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setConnError('Cannot connect to server. Is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  // load on first render
  useEffect(() => {
    loadData(true);
  }, []);

  // reload whenever user switches back to the dashboard tab
  useEffect(() => {
    if (activePage === 'dashboard') {
      loadData(false);
    }
  }, [activePage]);

  const handleSuccess = () => {
    loadData(false);
  };

  // page header info per tab
  const pageInfo = {
    dashboard: { title: 'Dashboard', sub: 'Live overview of parking slot availability and activity' },
    slots: { title: 'Slot Manager', sub: 'Add or remove parking slots from the system' },
    history: { title: 'Parking Logs', sub: 'Full history of all parking sessions' }
  };

  const current = pageInfo[activePage];

  return (
    <div className="app-shell">
      <Navbar activePage={activePage} onPageChange={setActivePage} slots={slots} />

      <div className="main-content" id="main-content">
        {/* Connection error strip */}
        {connError && (
          <div className="connection-error" id="conn-error-banner">
            ⚠️ {connError}
          </div>
        )}

        {/* Top page header */}
        <div className="page-header" id="page-header">
          <div>
            <div className="page-header-title">{current.title}</div>
            <div className="page-header-sub">{current.sub}</div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-body" id="page-body">
          {activePage === 'dashboard' && (
            <>
              {/* Stat cards */}
              <AvailabilityCards slots={slots} />

              {/* Interactive slot grid */}
              <SlotGrid slots={allSlots} />

              {/* Park + Exit forms side by side */}
              <div className="action-grid" id="action-grid">
                <ParkVehicleForm onSuccess={handleSuccess} />
                <ExitVehicleForm onSuccess={handleSuccess} />
              </div>

              {/* Parked vehicles list */}
              <ParkedVehiclesTable
                vehicles={parked}
                loading={loading}
                onRefresh={handleSuccess}
              />
            </>
          )}

          {activePage === 'slots' && <SlotManager />}

          {activePage === 'history' && <HistoryLogs />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
