import { useState, useEffect } from 'react';
import { Form, Card } from 'react-bootstrap';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import BookingModal from '../../components/BookingModal';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  // Add these new states for booking functionality
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Handle search
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use getAllServices endpoint instead of search
      const params = {
        search: searchQuery,
        category: selectedCategory,
        status: 'active'
      };

      console.log('Searching with params:', params);
      const response = await api.get('/services', { params });
      
      if (response.data.services) {
        setServices(response.data.services);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  // Add these handlers for booking functionality
  const handleBooking = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedService(null);
    // If you have notification functionality, you could implement it here
    // Otherwise, you can add an alert or some UI feedback
    alert('Service booked successfully!');
  };

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">Available Services</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Control
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <Form.Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : services.length === 0 ? (
        <div className="alert alert-info">No services found</div>
      ) : (
        <div className="row g-4">
          {services.map(service => (
            <div key={service._id} className="col-md-4">
              <div className="card h-100">
                {service.imageUrl && (
                  <img 
                    src={service.imageUrl} 
                    className="card-img-top" 
                    alt={service.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                    }}
                  />
                )}
                <div className="card-body">
                  <h5 className="card-title">{service.title}</h5>
                  {service.category && (
                    <p className="card-text text-muted">
                      <small>Category: {service.category.name}</small>
                    </p>
                  )}
                  <p className="card-text">{service.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="h5 mb-0">₹{service.price}</span>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleBooking(service)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* BookingModal component */}
      {selectedService && (
        <BookingModal
          show={showBookingModal}
          onHide={() => setShowBookingModal(false)}
          service={selectedService}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default Services;