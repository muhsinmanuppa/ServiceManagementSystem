import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ServiceHistory from '../../components/provider/ServiceHistory';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedServices: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        console.log('Fetching provider stats...');
        const response = await api.get('/provider/stats');
        console.log('Provider stats response:', response.data);
        
        if (response.data.success) {
          setStats({
            activeBookings: parseInt(response.data.activeBookings) || 0,
            completedServices: parseInt(response.data.completedServices) || 0,
            totalEarnings: parseFloat(response.data.totalEarnings) || 0
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        dispatch(showNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to load dashboard data'
        }));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">Provider Dashboard</h2>
      
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <h6>Active Services</h6>
              <h2>{stats?.activeBookings || 0}</h2>
              <small>Current Active Bookings</small>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <h6>Completed Services</h6>
              <h2>{stats?.completedServices || 0}</h2>
              <small>Successfully Delivered</small>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <h6>Total Earnings</h6>
              <h2>₹{(stats?.totalEarnings || 0).toLocaleString()}</h2>
              <small>From Completed Services</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <ServiceHistory />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
