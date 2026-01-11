import React, { useState } from 'react';

export default function UserManagement({ users, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Users Management</h5>
      </div>
      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select 
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="provider">Service Providers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge bg-${
                      user.role === 'admin' ? 'danger' : 
                      user.role === 'provider' ? 'primary' : 
                      'info'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.verified ? 'bg-success' : 'bg-warning'}`}>
                      {user.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => {/* View user details */}}
                      >
                        View
                      </button>
                      <button 
                        className={`btn ${user.status !== 'inactive' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => onStatusChange(user._id, user.status === 'inactive' ? 'active' : 'inactive')}
                      >
                        {user.status === 'inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                      {!user.verified && (
                        <button 
                          className="btn btn-outline-warning"
                          onClick={() => {/* Resend verification */}}
                        >
                          Resend Verification
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center mt-3">
            <p className="text-muted">No users found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
