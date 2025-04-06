import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import ServiceSearch from '../../components/ServiceSearch';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showNotification } from '../../store/slices/notificationSlice';
import BookingModal from '../../components/BookingModal';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const dispatch = useDispatch();

  const searchServices = async (searchParams) => {
    try {
      setLoading(true);
      setError(null); // Clear any existing errors
      const response = await api.get('/services', { 
        params: searchParams
      });
      setServices(response.data.services || []);
    } catch (error) {
      const message = error.response?.data?.message || 'Error fetching services';
      setError(message);
      dispatch(showNotification({
        type: 'error',
        message
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchServices({});
  }, []);

  const handleBooking = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedService(null);
    dispatch(showNotification({
      type: 'success',
      message: 'Service booked successfully!'
    }));
  };

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">Available Services</h2>
      
      <ServiceSearch onSearch={searchServices} />
      
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
