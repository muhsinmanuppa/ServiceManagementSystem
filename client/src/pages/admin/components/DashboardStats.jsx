import React from 'react';
import { formatPrice } from '../../../utils/serviceUtils';

export default function DashboardStats({ stats }) {
  return (
    <div>
      <div className="row">
        <div className="col-md-3 mb-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <p className="card-text display-4">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Total Services</h5>
              <p className="card-text display-4">{stats.totalServices}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Total Bookings</h5>
              <p className="card-text display-4">{stats.totalBookings}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-warning text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Pending Approvals</h5>
              <p className="card-text display-4">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Bookings</h5>
            </div>
            <div className="card-body">
              {stats.recentBookings && stats.recentBookings.length > 0 ? (
                <div className="list-group">
                  {stats.recentBookings.map(booking => (
                    <div key={booking._id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{booking.service?.title || 'Unknown Service'}</h6>
                        <small>{new Date(booking.scheduledDate).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-1">
                        Client: {booking.client?.name || 'Unknown'} | 
                        Status: <span className={`badge bg-${
                          booking.status === 'confirmed' ? 'success' : 
                          booking.status === 'pending' ? 'warning' : 'secondary'
                        }`}>{booking.status}</span>
                      </p>
                      <small>{formatPrice(booking.totalAmount)}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No recent bookings</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">System Activity</h5>
            </div>
            <div className="card-body">
              <div className="list-group">
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">System Status</h6>
                    <span className="badge bg-success">Operational</span>
                  </div>
                  <p className="mb-1">All systems are running normally</p>
                </div>
                <div className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">Last Database Backup</h6>
                    <small>{new Date().toLocaleDateString()}</small>
                  </div>
                  <p className="mb-1">Automatic backup completed successfully</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">
                  <i className="bi bi-plus-circle me-2"></i> Add New Category
                </button>
                <button className="btn btn-outline-secondary">
                  <i className="bi bi-envelope me-2"></i> Send Announcement
                </button>
                <button className="btn btn-outline-info">
                  <i className="bi bi-file-earmark-text me-2"></i> Generate Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
