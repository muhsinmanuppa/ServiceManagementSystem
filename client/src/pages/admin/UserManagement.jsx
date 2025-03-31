import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

const UserManagement = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        dispatch(showNotification({
          message: 'Failed to load users',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [dispatch]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      
      dispatch(showNotification({
        message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.response?.data?.message || 'Error updating user status',
        type: 'error'
      }));
    }
  };

  const openUserModal = (user, mode) => {
    setSelectedUser(user);
    setModalMode(mode);
    setShowModal(true);
  };

  const handleVerifyUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify`);
      
      // Update user in the local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, verified: true } : user
      ));
      
      dispatch(showNotification({
        message: 'User verified successfully',
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.response?.data?.message || 'Error verifying user',
        type: 'error'
      }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${userId}`);
      
      // Remove user from the local state
      setUsers(users.filter(user => user._id !== userId));
      
      dispatch(showNotification({
        message: 'User deleted successfully',
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.response?.data?.message || 'Error deleting user',
        type: 'error'
      }));
    }
  };

  // Filter users based on search, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status === 'active') ||
      (statusFilter === 'inactive' && user.status === 'inactive') ||
      (statusFilter === 'unverified' && !user.verified);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>User Management</h3>
        <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise me-2"></i>Refresh
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="client">Clients</option>
                <option value="provider">Providers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">No users found matching your criteria.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle bg-${
                          user.role === 'admin' ? 'danger' :
                          user.role === 'provider' ? 'success' : 'primary'
                        } text-white p-2 me-2`} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold">{user.name}</div>
                          <small className="text-muted">
                            {user.verified ? (
                              <span className="text-success">
                                <i className="bi bi-check-circle-fill me-1"></i>Verified
                              </span>
                            ) : (
                              <span className="text-danger">
                                <i className="bi bi-exclamation-circle-fill me-1"></i>Unverified
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.role === 'admin' ? 'bg-danger' :
                        user.role === 'provider' ? 'bg-success' : 'bg-primary'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${user.status === 'active' ? 'success' : 'secondary'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openUserModal(user, 'view')}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openUserModal(user, 'edit')}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {user.status === 'active' ? (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            title="Deactivate User"
                            onClick={() => handleStatusChange(user._id, 'inactive')}
                          >
                            <i className="bi bi-pause-fill"></i>
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            title="Activate User"
                            onClick={() => handleStatusChange(user._id, 'active')}
                          >
                            <i className="bi bi-play-fill"></i>
                          </button>
                        )}
                        {!user.verified && (
                          <button
                            className="btn btn-sm btn-outline-info"
                            title="Verify User"
                            onClick={() => handleVerifyUser(user._id)}
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete User"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && selectedUser && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'view' ? 'User Details' : 'Edit User'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={selectedUser.name} 
                        readOnly={modalMode === 'view'} 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        value={selectedUser.email} 
                        readOnly 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select 
                        className="form-select" 
                        value={selectedUser.role} 
                        disabled={modalMode === 'view'}
                      >
                        <option value="client">Client</option>
                        <option value="provider">Provider</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select 
                        className="form-select" 
                        value={selectedUser.status} 
                        disabled={modalMode === 'view'}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Joined On</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={new Date(selectedUser.createdAt).toLocaleString()} 
                        readOnly 
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Verified</label>
                      <div className="form-control">
                        {selectedUser.verified ? (
                          <span className="text-success">
                            <i className="bi bi-check-circle-fill me-1"></i>Yes
                          </span>
                        ) : (
                          <span className="text-danger">
                            <i className="bi bi-x-circle-fill me-1"></i>No
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Last Updated</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={new Date(selectedUser.updatedAt).toLocaleString()} 
                    readOnly 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                {modalMode === 'edit' && (
                  <button type="button" className="btn btn-primary">
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
