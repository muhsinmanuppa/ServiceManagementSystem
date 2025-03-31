import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const ServiceHistory = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await api.get('/provider/bookings');
        
        // Sort bookings by date in descending order
        const sortedBookings = (response.data.bookings || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setServices(sortedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        dispatch(showNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to load service history'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Service History</h5>
      </div>
      <div className="card-body">
        {services.length === 0 ? (
          <p className="text-muted text-center">No bookings found</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {services.map(booking => (
                  <tr key={booking._id}>
                    <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td>{booking.service?.title || 'N/A'}</td>
                    <td>{booking.client?.name || 'N/A'}</td>
                    <td>₹{booking.totalAmount?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`badge bg-${booking.payment?.status === 'paid' ? 'success' : 'warning'}`}>
                        {booking.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'confirmed': return 'primary';
    case 'cancelled': return 'danger';
    default: return 'warning';
  }
};

export default ServiceHistory;
