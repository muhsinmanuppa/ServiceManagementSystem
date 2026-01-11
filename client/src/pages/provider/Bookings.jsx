import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchBookings, 
  updateBookingStatus,
  selectAllBookings, 
  selectBookingsLoading, 
  selectBookingsError,
  setSelectedBooking
} from '../../store/slices/bookingSlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import BookingStatusModal from '../../components/BookingStatusModal';

const ProviderBookings = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectAllBookings) || []; // Add fallback empty array
  const loading = useSelector(selectBookingsLoading) || false; // Add fallback values
  const error = useSelector(selectBookingsError) || null;
  const [statusModal, setStatusModal] = useState({ open: false, booking: null });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchBookings('provider'));
  }, [dispatch]);

  const handleStatusUpdate = async (bookingId, status, notes = '') => {
    try {
      await dispatch(updateBookingStatus({ 
        id: bookingId, 
        status, 
        notes 
      })).unwrap();
      
      setStatusModal({ open: false, booking: null });
      
      dispatch(showNotification({
        type: 'success',
        message: `Booking ${status} successfully`
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error || 'Failed to update booking status'
      }));
    }
  };

  const openStatusModal = (booking) => {
    setStatusModal({ open: true, booking });
  };

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    if (!booking || !booking.service || !booking.client) return false;
    return filter === 'all' || booking.status === filter;
  }) : [];

  if (loading && !bookings.length) return <LoadingSpinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'confirmed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const renderQuoteStatus = (booking) => {
    if (!booking.quote) return null;

    return (
      <div className="mt-2">
        <small className="text-muted">
          Quote: ₹{booking.quote.price} ({booking.quote.estimatedHours} hrs)
          {booking.quote.approved && (
            <span className="badge bg-success ms-2">Approved</span>
          )}
        </small>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Bookings</h2>
        <div className="d-flex">
          <select 
            className="form-select me-2" 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center my-5 py-5">
          <i className="bi bi-calendar-x display-1 text-muted"></i>
          <h4 className="mt-3">No bookings found</h4>
          <p className="text-muted">
            {filter !== 'all' 
              ? `You don't have any ${filter} bookings.` 
              : 'You have no bookings to manage yet.'}
          </p>
        </div>
      ) : (
        <div className="row mb-4">
          <div className="col">
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(booking => (
                        <tr key={booking._id}>
                          <td>{booking.service?.title || 'Unknown Service'}</td>
                          <td>{booking.client?.name || 'Unknown Client'}</td>
                          <td>{new Date(booking.scheduledDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge bg-${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                            {renderQuoteStatus(booking)}
                          </td>
                          <td>
                            <span className={`badge ${booking.payment?.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                              {booking.payment?.status || 'pending'}
                            </span>
                          </td>
                          <td>₹{booking.totalAmount || booking.amount || 0}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              
                              {booking.status === 'confirmed' && (
                                <button
                                  className="btn btn-info"
                                  onClick={() => handleStatusUpdate(booking._id, 'in_progress')}
                                >
                                  Start
                                </button>
                              )}
                              
                              {booking.status === 'in_progress' && (
                                <button
                                  className="btn btn-success"
                                  onClick={() => openStatusModal(booking)}
                                >
                                  Complete
                                </button>
                              )}
                              
                              <Link
                                to={`/provider/bookings/${booking._id}`}
                                className="btn btn-outline-primary"
                              >
                                Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {statusModal.open && (
        <BookingStatusModal
          booking={statusModal.booking}
          onClose={() => setStatusModal({ open: false, booking: null })}
          onUpdateStatus={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default ProviderBookings;
