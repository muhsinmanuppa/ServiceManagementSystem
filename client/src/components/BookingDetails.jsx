import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateBookingStatus } from '../store/slices/bookingSlice';
import RatingStars from './RatingStars';

const BookingDetails = ({ booking }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      await dispatch(updateBookingStatus({
        id: booking._id,
        status: newStatus
      })).unwrap();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const canUpdateStatus = user.role === 'provider' && booking.status !== 'completed';

  return (
    <div className="card">
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h5>Service Details</h5>
            <p><strong>Service:</strong> {booking.service.title}</p>
            <p><strong>Provider:</strong> {booking.provider.name}</p>
            <p><strong>Amount:</strong> ₹{booking.amount}</p>
            <p><strong>Status:</strong> 
              <span className={`badge bg-${
                booking.status === 'completed' ? 'success' : 
                booking.status === 'cancelled' ? 'danger' : 'info'
              } ms-2`}>
                {booking.status}
              </span>
            </p>
          </div>
          <div className="col-md-6">
            <h5>Booking Details</h5>
            <p><strong>Date:</strong> {new Date(booking.scheduledDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(booking.scheduledDate).toLocaleTimeString()}</p>
            {booking.notes && (
              <p><strong>Notes:</strong> {booking.notes}</p>
            )}
          </div>
        </div>

        {canUpdateStatus && (
          <div className="mt-4">
            <h5>Update Status</h5>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary"
                onClick={() => handleStatusUpdate('confirmed')}
                disabled={loading || booking.status === 'confirmed'}
              >
                Confirm
              </button>
              <button
                className="btn btn-outline-info"
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={loading || booking.status === 'in_progress'}
              >
                Start Service
              </button>
              <button
                className="btn btn-outline-success"
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading || booking.status === 'completed'}
              >
                Complete
              </button>
            </div>
          </div>
        )}

        {booking.rating && (
          <div className="mt-4">
            <h5>Review</h5>
            <RatingStars rating={booking.rating.score} readonly />
            <p className="mt-2">{booking.rating.review}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetails;
