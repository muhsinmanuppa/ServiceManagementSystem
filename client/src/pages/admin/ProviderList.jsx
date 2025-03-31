import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Table, Badge, Button, Modal, Card } from 'react-bootstrap';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProviderStats from '../../components/admin/ProviderStats';

const ProviderList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    verificationStatus: ''
  });
  const dispatch = useDispatch();

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
      
      const response = await api.get('/admin/providers/list', { params }); // Update endpoint
      
      if (response.data.success) {
        console.log('Fetched providers:', response.data.providers); // Add debug log
        setProviders(response.data.providers);
      } else {
        throw new Error(response.data.message || 'Failed to fetch providers');
      }
    } catch (error) {
      console.error('Provider fetch error:', error);
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch providers'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Add debug logging
  useEffect(() => {
    console.log('Current filters:', filters);
  }, [filters]);

  useEffect(() => {
    fetchProviders();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = async (providerId, newStatus) => {
    try {
      await api.put(`/admin/providers/${providerId}/status`, { status: newStatus });
      
      setProviders(providers.map(provider => 
        provider._id === providerId 
          ? { ...provider, status: newStatus }
          : provider
      ));

      dispatch(showNotification({
        type: 'success',
        message: `Provider ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`
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
      <h2 className="my-4">Provider Management</h2>
      <ProviderStats />
      
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search providers..."
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
                <th>Email</th>
                <th>Verification Status</th>
                <th>Account Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(provider => (
                <tr key={provider._id}>
                  <td>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowDetails(true);
                      }}
                    >
                      {provider.name}
                    </Button>
                  </td>
                  <td>{provider.email}</td>
                  <td>{getStatusBadge(provider.verificationStatus?.status)}</td>
                  <td>{getStatusBadge(provider.status || 'active')}</td>
                  <td>{new Date(provider.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="btn-group">
                      {provider.status !== 'suspended' ? (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleStatusChange(provider._id, 'suspended')}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleStatusChange(provider._id, 'active')}
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
          <Modal.Title>Provider Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProvider && (
            <div>
              <h5>Basic Information</h5>
              <p><strong>Name:</strong> {selectedProvider.name}</p>
              <p><strong>Email:</strong> {selectedProvider.email}</p>
              <p><strong>Joined:</strong> {new Date(selectedProvider.createdAt).toLocaleDateString()}</p>
              
              <h5 className="mt-4">Verification Details</h5>
              <p><strong>Status:</strong> {getStatusBadge(selectedProvider.verificationStatus?.status)}</p>
              {selectedProvider.verificationStatus?.remarks && (
                <p><strong>Remarks:</strong> {selectedProvider.verificationStatus.remarks}</p>
              )}
              {selectedProvider.document?.url && (
                <p>
                  <strong>Document:</strong>{' '}
                  <a href={selectedProvider.document.url} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </p>
              )}
              
              <h5 className="mt-4">Business Description</h5>
              <p>{selectedProvider.description || 'No description provided'}</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProviderList;
