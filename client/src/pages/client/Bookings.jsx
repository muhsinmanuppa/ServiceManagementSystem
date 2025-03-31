import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchBookings,
  cancelBooking,
  selectAllBookings,
  selectBookingsLoading,
  selectBookingsError
} from '../../store/slices/bookingSlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/serviceUtils';

const defaultImageUrl = 'https://placehold.co/50x50/eee/999?text=Service';

const Bookings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const bookings = useSelector(selectAllBookings) || []; // Add fallback empty array
  const loading = useSelector(selectBookingsLoading) || false; // Add fallback values
  const error = useSelector(selectBookingsError) || null;
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        await dispatch(fetchBookings('client')).unwrap();
      } catch (err) {
        dispatch(showNotification({
          type: 'error',
          message: err.message || 'Failed to load bookings'
        }));
      }
    };
    loadBookings();
  }, [dispatch]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await dispatch(cancelBooking(bookingId)).unwrap();
      dispatch(showNotification({
        type: 'success',
        message: 'Booking cancelled successfully'
      }));
    } catch (err) {
      dispatch(showNotification({
        type: 'error',
        message: err.message || 'Failed to cancel booking'
      }));
    }
  };
  
  // Filter bookings based on status and search term
  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {
    // Skip items with missing service property
    if (!booking || !booking.service || !booking.provider) return false;
    
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      booking.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) : [];

  if (loading && !bookings.length) return <LoadingSpinner />;
  
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="container-fluid px-0">
      <h3 className="mb-4">My Bookings</h3>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8 mb-3 mb-md-0">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by service or provider name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
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
        </div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {filteredBookings.length === 0 ? (
        <div className="text-center my-5 py-5">
          <i className="bi bi-calendar-x display-1 text-muted"></i>
          <h4 className="mt-3">No bookings found</h4>
          <p className="text-muted">
            {filter !== 'all' 
              ? `You don't have any ${filter} bookings.` 
              : searchTerm 
                ? 'No bookings match your search.' 
                : 'You have not made any bookings yet.'}
          </p>
          <Link to="/client/services" className="btn btn-primary">Find Services</Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Service</th>
                <th>Provider</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking._id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img 
                        src={(booking.service?.imageUrl) || defaultImageUrl} 
                        alt={booking.service?.title || 'Service'}
                        className="rounded me-2"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultImageUrl;
                        }}
                      />
                      <div>{booking.service?.title || 'Unknown Service'}</div>
                    </div>
                  </td>
                  <td>{booking.provider?.name || 'Unknown Provider'}</td>
                  <td>{new Date(booking.scheduledDate).toLocaleString()}</td>
                  <td>{formatPrice(booking.totalAmount || booking.amount || 0)}</td>
                  <td>
                    <span className={`badge bg-${getStatusBadgeColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${booking.payment?.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                      {booking.payment?.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <Link 
                        to={`/client/bookings/${booking._id}`}
                        className="btn btn-outline-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Navigating to booking:', booking._id);
                          navigate(`/client/bookings/${booking._id}`);
                        }}
                      >
                        View Details
                      </Link>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button 
                          className="btn btn-outline-danger"
                          onClick={() => handleCancelBooking(booking._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Bookings;
