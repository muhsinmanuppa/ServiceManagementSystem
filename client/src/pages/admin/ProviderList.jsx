import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Table, Badge, Button, Modal, Card } from 'react-bootstrap';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProviderStats from '../../components/admin/ProviderStats';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    verificationStatus: ''
  });

  const dispatch = useDispatch();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);

      const response = await api.get('/admin/providers/list', { params });

      if (response.data.success) {
        console.log('Fetched users:', response.data.users);
        setUsers(Array.isArray(response.data.providers) ? response.data.providers : []);


      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('User fetch error:', error);
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch users'
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api.put(`/admin/providers/${userId}/status`, { status: newStatus });

      setUsers(prev =>
        prev.map(user =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      );

      dispatch(showNotification({
        type: 'success',
        message: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update status'
      }));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'success',
      suspended: 'danger',
      pending: 'warning',
      verified: 'success',
      rejected: 'danger',
      unverified: 'secondary'
    };
    return <Badge bg={badges[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">User Management</h2>
      <ProviderStats /> 

      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search users..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Account Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="verificationStatus"
                value={filters.verificationStatus}
                onChange={handleFilterChange}
              >
                <option value="">All Verification Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Verification Status</th>
                <th>Account Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.map(user => (
                <tr key={user._id}>
                  <td>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDetails(true);
                      }}
                    >
                      {user.name}
                    </Button>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td>{getStatusBadge(user.verificationStatus?.status)}</td>
                  <td>{getStatusBadge(user.status || 'active')}</td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="btn-group">
                      {user.status !== 'suspended' ? (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusChange(user._id, 'suspended')}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(user._id, 'active')}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <h5>Basic Information</h5>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>

              <h5 className="mt-4">Verification Details</h5>
              <p><strong>Status:</strong> {getStatusBadge(selectedUser.verificationStatus?.status)}</p>
              {selectedUser.verificationStatus?.remarks && (
                <p><strong>Remarks:</strong> {selectedUser.verificationStatus.remarks}</p>
              )}
              {selectedUser.document?.url && (
                <p>
                  <strong>Document:</strong>{' '}
                  <a href={selectedUser.document.url} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </p>
              )}

              <h5 className="mt-4">Business Description</h5>
              <p>{selectedUser.description || 'No description provided'}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserList;
