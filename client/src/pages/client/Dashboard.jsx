import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchPaymentHistory } from '../../store/slices/paymentSlice'; 
import PaymentHistory from '../../components/PaymentHistory';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsResponse] = await Promise.all([
          api.get('/client/stats'),
          dispatch(fetchPaymentHistory()).unwrap()
        ]);
        
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        dispatch(showNotification({
          type: 'error',
          message: 'Failed to load dashboard data'
        }));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">Dashboard</h2>
      
      {stats && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card bg-primary text-white h-100">
                <div className="card-body">
                  <h6>Active Bookings</h6>
                  <h2>{stats.stats?.activeBookings || 0}</h2>
                  <small>In Progress & Pending</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card bg-success text-white h-100">
                <div className="card-body">
                  <h6>Completed Services</h6>
                  <h2>{stats.stats?.completedServices || 0}</h2>
                  <small>Successfully Completed</small>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card bg-info text-white h-100">
                <div className="card-body">
                  <h6>Total Services</h6>
                  <h2>{stats.stats?.totalServices || 0}</h2>
                  <small>All Time Total</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-12">
              <PaymentHistory />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
