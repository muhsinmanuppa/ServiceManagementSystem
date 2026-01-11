import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Card, Row, Col, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';

const Services = () => {
  const dispatch = useDispatch();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/provider/services');
      if (response.data.success) {
        setServices(response.data.services);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load services';
      setError(errorMessage);
      dispatch(showNotification({
        type: 'error',
        message: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const handleDelete = async () => {
    if (!serviceToDelete?._id) return;

    try {
      setIsDeleting(true);
      await api.delete(`/provider/services/${serviceToDelete._id}`);
      setServices(prevServices => 
        prevServices.filter(service => service._id !== serviceToDelete._id)
      );
      dispatch(showNotification({
        type: 'success',
        message: 'Service deleted successfully'
      }));
    } catch (err) {
      dispatch(showNotification({
        type: 'error',
        message: err.response?.data?.message || 'Error deleting service'
      }));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setServiceToDelete(null);
    }
  };

  const handleDeleteClick = useCallback((service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  }, []);

  const handleSubmit = async (formData) => {
    try {
    
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      
      if (formData.image) {
        data.append('serviceImages', formData.image);
      }

      const response = await api.post('/provider/services', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        dispatch(showNotification({
          type: 'success',
          message: 'Service created successfully'
        }));
        fetchServices();
      }
    } catch (err) {
      console.error('Service creation error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create service';
      dispatch(showNotification({
        type: 'error',
        message: errorMessage
      }));
    }
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="container-fluid px-4">
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <Button 
          variant="link" 
          className="p-0 ms-3" 
          onClick={fetchServices}
        >
          Try again
        </Button>
      </div>
    </div>
  );

  const servicesList = Array.isArray(services) ? services : [];

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Services</h2>
        <Link 
          to="/provider/services/add" 
          className="btn btn-primary"
          aria-label="Add new service"
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add New Service
        </Link>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {servicesList.map(service => (
          <Col key={service._id}>
            <Card className="h-100 shadow-sm hover-shadow">
              <Card.Img 
                variant="top" 
                src={service.imageUrl || 'https://res.cloudinary.com/dxtynhki3/image/upload/v1742727585/services/uw5h8xqnvfcfitppxps1.jpg'} 
                style={{ height: '200px', objectFit: 'cover' }}
                alt={service.title}
                loading="lazy"
              />
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <Card.Title className="mb-2">{service.title}</Card.Title>
                  
                </div>
                <Card.Subtitle className="mb-2 text-muted">
                  {service.category?.name || 'Uncategorized'}
                </Card.Subtitle>
                <Card.Text className="text-truncate mb-3">
                  {service.description}
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <h5 className="mb-0 text-primary">
                    {formatCurrency(service.price)}
                  </h5>
                  <div className="btn-group">
                    <Link 
                      to={`/provider/services/edit/${service._id}`} 
                      className="btn btn-sm btn-outline-primary"
                      aria-label={`Edit ${service.title}`}
                    >
                      Edit
                    </Link>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteClick(service)}
                      aria-label={`Delete ${service.title}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card.Body>
              <Card.Footer className="text-muted">
                <small>
                  Created: {new Date(service.createdAt).toLocaleDateString()}
                </small>
              </Card.Footer>
            </Card>
          </Col>
        ))}

        {servicesList.length === 0 && (
          <Col xs={12}>
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <h4 className="mt-3">No Services Yet</h4>
              <p className="text-muted">Start by adding your first service</p>
              <Link 
                to="/provider/services/add" 
                className="btn btn-primary"
                aria-label="Add your first service"
              >
                Add New Service
              </Link>
            </div>
          </Col>
        )}
      </Row>

      <Modal 
        show={showDeleteModal} 
        onHide={handleCloseModal}
        aria-labelledby="delete-modal-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="delete-modal-title">Delete Service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{serviceToDelete?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Services;