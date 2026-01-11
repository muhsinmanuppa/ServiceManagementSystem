import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings, selectAllBookings, selectBookingsLoading } from '../../store/slices/bookingSlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/serviceUtils';

const AdminBookings = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectAllBookings) || []; 
  const loading = useSelector(selectBookingsLoading) || false; 
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchBookings('admin'))
      .unwrap()
      .catch(err => {
        dispatch(showNotification({
          type: 'error',
          message: err.message || 'Failed to load bookings'
        }));
      });
  }, [dispatch]);

  const filteredBookings = Array.isArray(bookings) ? bookings.filter(booking => {

    if (!booking || !booking.service || !booking.provider || !booking.client) return false;
    
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = searchTerm === '' || 
      booking.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) : [];

  if (loading && !bookings.length) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">All Bookings</h2>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-8 mb-3 mb-md-0">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by service, provider, or client..."
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
      
      <div className="row mb-4">
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Bookings</h5>
              <h3 className="card-text">{bookings.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Completed</h5>
              <h3 className="card-text">{bookings.filter(b => b.status === 'completed').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h5 className="card-title">Pending</h5>
              <h3 className="card-text">{bookings.filter(b => b.status === 'pending').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6 mb-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title">Cancelled</h5>
              <h3 className="card-text">{bookings.filter(b => b.status === 'cancelled').length}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Service</th>
                  <th>Client</th>
                  <th>Provider</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking._id}>
                    <td>#{booking._id.substring(booking._id.length - 6)}</td>
                    <td>{booking.service?.title || 'Unknown Service'}</td>
                    <td>{booking.client?.name || 'Unknown Client'}</td>
                    <td>{booking.provider?.name || 'Unknown Provider'}</td>
                    <td>{new Date(booking.scheduledDate).toLocaleDateString()}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No bookings match your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'confirmed': return 'primary';
    case 'in_progress': return 'info';
    case 'completed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'secondary';
  }
};

export default AdminBookings;
