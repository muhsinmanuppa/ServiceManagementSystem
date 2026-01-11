import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to fetch users'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, status) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status });
      dispatch(showNotification({
        type: 'success',
        message: 'User status updated successfully'
      }));
      fetchUsers();
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update user status'
      }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">User Management</h2>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
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
                      <span className={`badge bg-${
                        user.status === 'active' ? 'success' :
                        user.status === 'suspended' ? 'danger' :
                        'warning'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {user.status === 'active' ? (
                          <button
                            className="btn btn-warning"
                            onClick={() => handleStatusUpdate(user._id, 'suspended')}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            className="btn btn-success"
                            onClick={() => handleStatusUpdate(user._id, 'active')}
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          className="btn btn-info"
                          onClick={() => {/* view details*/}}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManager;
