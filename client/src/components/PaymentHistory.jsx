import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentHistory } from '../store/slices/paymentSlice';
import { showNotification } from '../store/slices/notificationSlice';
import LoadingSpinner from './LoadingSpinner';
import Alert from './Alert';

const PaymentHistory = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  
  const { paymentHistory, loading } = useSelector(state => ({
    paymentHistory: state.payment?.paymentHistory || [],
    loading: state.payment?.loading || false
  }));

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setError(null);
        const result = await dispatch(fetchPaymentHistory()).unwrap();
        console.log('Payment history result:', result); // Add debug logging
      } catch (error) {
        setError(error.message || 'Failed to load payment history');
        dispatch(showNotification({
          type: 'error',
          message: error.message || 'Failed to load payment history'
        }));
      }
    };

    fetchHistory();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <Alert type="danger" message={`Error loading service history: ${error}`} />;
  }

  const services = Array.isArray(paymentHistory) ? paymentHistory : [];

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Service History</h5>
      </div>
      <div className="card-body">
        {services.length === 0 ? (
          <p className="text-muted text-center">No service history found</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Work Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service._id || Math.random().toString()}>
                    <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                    <td>{service.service || 'N/A'}</td>
                    <td>₹{service.amount?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className={`badge bg-${service.paymentStatus === 'paid' ? 'success' : 'warning'}`}>
                        {service.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusColor(service.workStatus)}`}>
                        {service.workStatus}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted" title={service.trackingNotes}>
                        {new Date(service.lastUpdated).toLocaleString()}
                      </small>
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
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'confirmed':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'warning';
  }
};

export default PaymentHistory;
