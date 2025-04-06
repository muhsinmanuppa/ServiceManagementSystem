import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServices, updateServiceStatus, deleteService } from '../../store/slices/serviceSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { showNotification } from '../../store/slices/notificationSlice';
import { formatPrice } from '../../utils/serviceUtils';
import LoadingSpinner from '../../components/LoadingSpinner';

const ServiceManagement = () => {
  const dispatch = useDispatch();
  const services = useSelector(state => state.services.items);
  const servicesStatus = useSelector(state => state.services.status);
  const categories = useSelector(state => state.categories.items);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(fetchServices()).unwrap(),
          dispatch(fetchCategories()).unwrap()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch(showNotification({
          message: 'Failed to load services',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [dispatch]);

  const handleStatusChange = async (serviceId, newStatus) => {
    try {
      if (newStatus === 'inactive') {
        setSelectedService(serviceId);
        setShowRejectionModal(true);
        return;
      }
      
      await dispatch(updateServiceStatus({
        id: serviceId,
        status: newStatus
      })).unwrap();
      
      dispatch(showNotification({
        message: `Service ${newStatus === 'active' ? 'approved' : 'updated'} successfully`,
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Error updating service status',
        type: 'error'
      }));
    }
  };

  const handleRejectSubmit = async () => {
    try {
      await dispatch(updateServiceStatus({
        id: selectedService,
        status: 'inactive',
        rejectionReason
      })).unwrap();
      
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedService(null);
      
      dispatch(showNotification({
        message: 'Service rejected successfully',
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Error rejecting service',
        type: 'error'
      }));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }
    
    try {
      await dispatch(deleteService(serviceId)).unwrap();
      dispatch(showNotification({
        message: 'Service deleted successfully',
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Error deleting service',
        type: 'error'
      }));
    }
  };

  // Filter services based on search term, status, and category
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading || servicesStatus === 'loading') return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Service Management</h3>
        <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise me-2"></i>Refresh
        </button>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search services..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Rejected</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <div className="d-grid">
                <Link to="/admin/services/add" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>Add Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {filteredServices.length === 0 ? (
        <div className="alert alert-info">
          No services found matching your search criteria.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th>Service</th>
                <th>Provider</th>
                <th>Price</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => (
                <tr key={service._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img
                        src={service.imageUrl}
                        alt={service.title}
                        className="rounded me-2"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                      <div>
                        <div className="fw-bold">{service.title}</div>
                        <small className="text-muted">{service.description.substring(0, 60)}...</small>
                      </div>
                    </div>
                  </td>
                  <td>{service.provider?.name || 'Unknown'}</td>
                  <td>{formatPrice(service.price)}</td>
                  <td>
                    {categories.find(c => c._id === service.category)?.name || 'Uncategorized'}
                  </td>
                  <td>
                    <span className={`badge ${
                      service.status === 'active' ? 'bg-success' :
                      service.status === 'pending' ? 'bg-warning' :
                      'bg-danger'
                    }`}>
                      {service.status}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <Link to={`/services/${service._id}`} className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye"></i>
                      </Link>
                      <Link to={`/admin/services/edit/${service._id}`} className="btn btn-sm btn-outline-secondary">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      
                      {service.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm btn-outline-success"
                            title="Approve Service"
                            onClick={() => handleStatusChange(service._id, 'active')}
                          >
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            title="Reject Service"
                            onClick={() => handleStatusChange(service._id, 'inactive')}
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      )}
                      
                      {service.status === 'active' && (
                        <button 
                          className="btn btn-sm btn-outline-warning"
                          title="Deactivate Service"
                          onClick={() => handleStatusChange(service._id, 'inactive')}
                        >
                          <i className="bi bi-pause-fill"></i>
                        </button>
                      )}
                      
                      {service.status === 'inactive' && (
                        <button 
                          className="btn btn-sm btn-outline-success"
                          title="Activate Service"
                          onClick={() => handleStatusChange(service._id, 'active')}
                        >
                          <i className="bi bi-play-fill"></i>
                        </button>
                      )}
                      
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Service"
                        onClick={() => handleDeleteService(service._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Service</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectionModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Please provide a reason for rejecting this service:</p>
                <textarea
                  className="form-control"
                  rows="4"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection here..."
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRejectSubmit}
                  disabled={!rejectionReason.trim()}
                >
                  Reject Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
