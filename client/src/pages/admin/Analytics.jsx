import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';

const Analytics = () => {
  const [data, setData] = useState({
    revenue: {
      total: 0,
      monthly: [],
      growth: 0
    },
    users: {
      total: 0,
      providers: 0,
      clients: 0,
      growth: 0
    },
    services: {
      total: 0,
      active: 0,
      categories: []
    },
    bookings: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // month, quarter, year
  const dispatch = useDispatch();

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/admin/analytics?timeframe=${timeframe}`);
      setData(response.data);
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to fetch analytics data'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Analytics Dashboard</h2>
        <div className="btn-group">
          <button 
            className={`btn btn-outline-primary ${timeframe === 'month' ? 'active' : ''}`}
            onClick={() => setTimeframe('month')}
          >
            Monthly
          </button>
          <button 
            className={`btn btn-outline-primary ${timeframe === 'quarter' ? 'active' : ''}`}
            onClick={() => setTimeframe('quarter')}
          >
            Quarterly
          </button>
          <button 
            className={`btn btn-outline-primary ${timeframe === 'year' ? 'active' : ''}`}
            onClick={() => setTimeframe('year')}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Revenue Overview</h5>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <h3>₹{data.revenue.total.toLocaleString()}</h3>
                  <small className="text-muted">Total Revenue</small>
                </div>
                <div className={`badge bg-${data.revenue.growth >= 0 ? 'success' : 'danger'} h-50`}>
                  {data.revenue.growth}% {data.revenue.growth >= 0 ? '↑' : '↓'}
                </div>
              </div>
              {/* Revenue chart would go here */}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">User Statistics</h5>
              <div className="row g-3">
                <div className="col-6">
                  <div className="border rounded p-3">
                    <h6>Total Users</h6>
                    <h3>{data.users.total}</h3>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <h6>Providers</h6>
                    <h3>{data.users.providers}</h3>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <h6>Clients</h6>
                    <h3>{data.users.clients}</h3>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-3">
                    <h6>Growth</h6>
                    <h3>{data.users.growth}%</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Stats */}
      <div className="row g-4">
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Booking Analytics</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="border rounded p-3 text-center">
                    <h6>Total</h6>
                    <h3>{data.bookings.total}</h3>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border rounded p-3 text-center">
                    <h6>Completed</h6>
                    <h3>{data.bookings.completed}</h3>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border rounded p-3 text-center">
                    <h6>Pending</h6>
                    <h3>{data.bookings.pending}</h3>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="border rounded p-3 text-center">
                    <h6>Cancelled</h6>
                    <h3>{data.bookings.cancelled}</h3>
                  </div>
                </div>
              </div>
              {/* Bookings trend chart would go here */}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Popular Categories</h5>
              <div className="list-group list-group-flush">
                {data.services.categories.map((category, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{category.name}</span>
                      <span className="badge bg-primary rounded-pill">
                        {category.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
