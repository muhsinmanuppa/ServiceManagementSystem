import React from 'react';

const DashboardStats = ({ stats }) => {
  return (
    <div className="row g-4">
      <div className="col-md-3">
        <div className="card bg-primary text-white">
          <div className="card-body">
            <h6>Total Bookings</h6>
            <h2>{stats?.totalBookings || 0}</h2>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card bg-success text-white">
          <div className="card-body">
            <h6>Active Bookings</h6>
            <h2>{stats?.activeBookings || 0}</h2>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card bg-info text-white">
          <div className="card-body">
            <h6>Completed</h6>
            <h2>{stats?.completedBookings || 0}</h2>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card bg-warning text-white">
          <div className="card-body">
            <h6>Available Services</h6>
            <h2>{stats?.totalServices || 0}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
