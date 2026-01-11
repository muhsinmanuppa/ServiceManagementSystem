import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBookings, updateBookingStatus, submitQuote, BOOKING_STATUS } from '../../store/slices/bookingSlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/serviceUtils';
import RatingStars from '../../components/RatingStars';

const ProviderBookings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { items: bookings, loading, error } = useSelector(state => {
    console.log('Booking state:', state.booking); 
    return state.booking;
  });

  useEffect(() => {
    const loadBookings = async () => {
      try {
        console.log('Fetching provider bookings...'); 
        await dispatch(fetchBookings('provider')).unwrap();
      } catch (err) {
        console.error('Error loading bookings:', err); 
        dispatch(showNotification({
          type: 'error',
          message: err.message || 'Failed to load bookings'
        }));
      }
    };
    
    loadBookings();
  }, [dispatch]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await dispatch(updateBookingStatus({
        id: bookingId,
        status: newStatus,
        notes: `Service ${newStatus.replace('_', ' ')} by provider`
      })).unwrap();
      
      dispatch(showNotification({
        type: 'success',
        message: `Booking ${newStatus} successfully`
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || 'Failed to update status'
      }));
    }
  };

  const handleQuoteSubmit = async (bookingId, quoteData) => {
    try {
      await dispatch(submitQuote({ bookingId, quoteData })).unwrap();
      dispatch(showNotification({
        type: 'success',
        message: 'Quote submitted successfully'
      }));
    } catch (error) {
      dispatch.showNotification({
        type: 'error',
        message: error.message || 'Failed to submit quote'
      });
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      booking.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeColor = (status) => {
    const colors = {
      [BOOKING_STATUS.PENDING]: 'warning',
      [BOOKING_STATUS.QUOTED]: 'info',
      [BOOKING_STATUS.CONFIRMED]: 'primary',
      [BOOKING_STATUS.IN_PROGRESS]: 'info',
      [BOOKING_STATUS.COMPLETED]: 'success',
      [BOOKING_STATUS.CANCELLED]: 'danger'
    };
    return colors[status] || 'secondary';
  };

  if (loading && !bookings?.length) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Service Bookings</h3>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select 
            className="form-select w-auto"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {Object.values(BOOKING_STATUS).map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Review</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings?.map(booking => (
              <tr key={booking._id}>
                <td>{booking.client?.name || 'Unknown Client'}</td>
                <td>{booking.service?.title || 'Unknown Service'}</td>
                <td>{new Date(booking.scheduledDate).toLocaleString()}</td>
                <td>{formatPrice(booking.totalAmount || 0)}</td>
                <td>
                  {booking.rating ? (
                    <div className="d-flex flex-column">
                      <div>
                        <RatingStars rating={Number(booking.rating.score) || 0} readonly size="sm" />
                      </div>
                      {(() => {
                        const text = (booking.rating?.review ?? booking.rating?.comment ?? '').toString();
                        return (
                          <small className="text-muted">
                            {text ? `Reviewed · ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}` : 'Reviewed'}
                          </small>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-muted">No review</span>
                  )}
                </td>
                <td>
                  <span className={`badge bg-${getStatusBadgeColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/provider/bookings/${booking._id}`)}
                    >
                      View Details
                    </button>
                    
                    {booking.status === BOOKING_STATUS.PENDING && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusUpdate(booking._id, BOOKING_STATUS.CONFIRMED)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleStatusUpdate(booking._id, BOOKING_STATUS.CANCELLED)}
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {booking.status === BOOKING_STATUS.CONFIRMED && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleStatusUpdate(booking._id, BOOKING_STATUS.IN_PROGRESS)}
                      >
                        Start Service
                      </button>
                    )}

                    {booking.status === BOOKING_STATUS.IN_PROGRESS && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to mark this booking as completed?')) {
                            handleStatusUpdate(booking._id, BOOKING_STATUS.COMPLETED);
                          }
                        }}
                      >
                        Complete Service
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProviderBookings;
