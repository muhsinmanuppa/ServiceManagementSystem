import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showNotification } from '../../store/slices/notificationSlice';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        if (response.data) {
          console.log('Admin stats:', response.data); // Add debug logging
          setStats(response.data);
        } else {
          throw new Error('No data received from server');
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        dispatch(showNotification({
          type: 'error',
          message: 'Failed to load dashboard statistics'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dispatch]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'in_progress': return 'info';
      case 'confirmed': return 'primary';
      default: return 'secondary';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h6>Total Users</h6>
              <h2>{stats?.totalUsers || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h6>Active Providers</h6>
              <h2>{stats?.activeProviders || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h6>Pending Verifications</h6>
              <h2>{stats?.pendingVerifications || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h6>Total Revenue</h6>
              <h2>₹{stats?.totalRevenue || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Activities</h5>
            </div>
            <div className="card-body">
              {stats?.recentActivities?.length > 0 ? (
                <div className="list-group">
                  {stats.recentActivities.map((activity, index) => (
                    <div key={activity.id || index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div>{activity.description}</div>
                          <small className={`badge bg-${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </small>
                          {activity.amount && (
                            <small className="ms-2">
                              Amount: ₹{activity.amount}
                            </small>
                          )}
                        </div>
                        <small className="text-muted">
                          {new Date(activity.timestamp).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center">No recent activities</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
