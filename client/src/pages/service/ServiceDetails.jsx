import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServices, selectServiceById } from '../../store/slices/serviceSlice';
import { fetchServiceReviews } from '../../store/slices/reviewSlice';
import ServiceReview from '../../components/ServiceReview';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/serviceUtils';
import BookingModal from '../../components/BookingModal';

export default function ServiceDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const service = useSelector(state => selectServiceById(state, id));
  const reviews = useSelector(state => state.reviews.items);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!service) {
          await dispatch(fetchServices()).unwrap();
        }
        await dispatch(fetchServiceReviews(id)).unwrap();
      } catch (error) {
        console.error('Error loading service details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, id, service]);

  if (loading) return <LoadingSpinner />;
  if (!service) return <div className="alert alert-danger">Service not found</div>;

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-8">
          <img
            src={service.imageUrl}
            alt={service.title}
            className="img-fluid rounded mb-4"
            style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
          />
          <h2>{service.title}</h2>
          <p className="lead">{service.description}</p>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>{formatPrice(service.price)}</h4>
            <div className="rating">
              ⭐ {service.averageRating.toFixed(1)} ({service.reviewCount} reviews)
            </div>
          </div>
          
          <div className="provider-info card mb-4">
            <div className="card-body">
              <h5>Service Provider</h5>
              <p>{service.provider.name}</p>
              <button className="btn btn-primary">Contact Provider</button>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-lg w-100"
            onClick={() => setShowBooking(true)}
          >
            Book Now
          </button>
          
          {showBooking && (
            <BookingModal 
              service={service} 
              onClose={() => setShowBooking(false)} 
            />
          )}
        </div>

        <div className="col-md-4">
          <ServiceReview serviceId={id} />
          <div className="reviews mt-4">
            <h4>Reviews</h4>
            {reviews.map(review => (
              <div key={review._id} className="card mb-2">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h6>{review.client.name}</h6>
                    <div>{'⭐'.repeat(review.rating)}</div>
                  </div>
                  <p className="mb-0">{review.comment}</p>
                  <small className="text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
