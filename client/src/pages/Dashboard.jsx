import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../store/slices/notificationSlice';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/client/stats');
        setStats(response.data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        dispatch(showNotification({
          type: 'error',
          message: error.response?.data?.message || 'Failed to load dashboard statistics'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">Dashboard</h2>
      
      {stats && (
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Bookings</h5>
                <p className="card-text h3">{stats.totalBookings}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Active Bookings</h5>
                <p className="card-text h3">{stats.activeBookings}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Completed</h5>
                <p className="card-text h3">{stats.completedBookings}</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Spent</h5>
                <p className="card-text h3">${stats.totalSpent}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
