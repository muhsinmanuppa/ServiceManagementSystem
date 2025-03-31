import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import ReviewForm from './ReviewForm';

const BookingList = ({ bookings, onStatusUpdate, onAddReview }) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user } = useSelector(state => state.auth);

  const handleReviewSubmit = async (reviewData) => {
    await onAddReview(selectedBooking._id, reviewData);
    setShowReviewForm(false);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'warning',
      confirmed: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'danger'
    };
    return `badge bg-${classes[status] || 'secondary'}`;
  };

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(booking => (
            <tr key={booking._id}>
              <td>
                <div className="d-flex align-items-center">
                  {booking.service.imageUrl && (
                    <img 
                      src={booking.service.imageUrl} 
                      alt={booking.service.title}
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      className="me-2 rounded"
                    />
                  )}
                  <div>
                    <h6 className="mb-0">{booking.service.title}</h6>
                    <small className="text-muted">
                      {user.role === 'client' ? booking.provider.name : booking.client.name}
                    </small>
                  </div>
                </div>
              </td>
              <td>{new Date(booking.scheduledDate).toLocaleDateString()}</td>
              <td>
                <span className={getStatusBadgeClass(booking.status)}>
                  {booking.status}
                </span>
              </td>
              <td>₹{booking.amount}</td>
              <td>
                <div className="btn-group">
                  <Link 
                    to={`/bookings/${booking._id}`} 
                    className="btn btn-sm btn-outline-primary"
                  >
                    View Details
                  </Link>
                  {booking.status === 'completed' && !booking.rating && user.role === 'client' && (
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowReviewForm(true);
                      }}
                    >
                      Add Review
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showReviewForm && selectedBooking && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Review</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowReviewForm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ReviewForm onSubmit={handleReviewSubmit} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;
