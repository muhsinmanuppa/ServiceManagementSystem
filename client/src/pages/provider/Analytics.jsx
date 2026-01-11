import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { fetchServices } from '../../store/slices/serviceSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/serviceUtils';

const Analytics = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(state => state.bookings.items);
  const services = useSelector(state => state.services.items);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year'
  const [stats, setStats] = useState({
    revenue: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    revenueByService: [],
    bookingsByMonth: [],
    servicePerformance: []
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(fetchBookings('provider')).unwrap(),
          dispatch(fetchServices()).unwrap()
        ]);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (bookings.length > 0) {
      const now = new Date();
      let startDate;
      
      switch(dateRange) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      }

      const filteredBookings = bookings.filter(booking => 
        new Date(booking.scheduledDate) >= startDate && new Date(booking.scheduledDate) <= now
      );

      const totalRevenue = filteredBookings.reduce((sum, booking) => {
        return booking.paymentStatus === 'paid' ? sum + booking.totalAmount : sum;
      }, 0);

      const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
      const pendingBookings = filteredBookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length;

      const serviceRevenue = {};
      
      filteredBookings.forEach(booking => {
        const serviceId = booking.service._id;
        const serviceTitle = booking.service.title;
        
        if (!serviceRevenue[serviceId]) {
          serviceRevenue[serviceId] = {
            serviceId,
            title: serviceTitle,
            revenue: 0,
            bookings: 0
          };
        }
        
        if (booking.paymentStatus === 'paid') {
          serviceRevenue[serviceId].revenue += booking.totalAmount;
        }
        
        serviceRevenue[serviceId].bookings += 1;
      });
      
      const revenueByService = Object.values(serviceRevenue).sort((a, b) => b.revenue - a.revenue);

      const bookingsByMonth = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthNames[monthDate.getMonth()];
        const monthYear = monthDate.getFullYear();
        
        const monthBookings = filteredBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledDate);
          return bookingDate.getMonth() === monthDate.getMonth() && 
                 bookingDate.getFullYear() === monthDate.getFullYear();
        });
        
        bookingsByMonth.push({
          month: `${monthName} ${monthYear}`,
          count: monthBookings.length,
          revenue: monthBookings.reduce((sum, b) => b.paymentStatus === 'paid' ? sum + b.totalAmount : sum, 0)
        });
      }
      
      const servicePerformance = services.map(service => {
        const serviceBookings = filteredBookings.filter(b => b.service._id === service._id);
        const completed = serviceBookings.filter(b => b.status === 'completed').length;
        const cancelled = serviceBookings.filter(b => b.status === 'cancelled').length;
        const revenue = serviceBookings.reduce((sum, b) => b.paymentStatus === 'paid' ? sum + b.totalAmount : sum, 0);
        
        return {
          serviceId: service._id,
          title: service.title,
          totalBookings: serviceBookings.length,
          completed,
          cancelled,
          revenue,
          completionRate: serviceBookings.length ? (completed / serviceBookings.length * 100).toFixed(1) : 0
        };
      }).filter(s => s.totalBookings > 0).sort((a, b) => b.totalBookings - a.totalBookings);

      setStats({
        revenue: totalRevenue,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        revenueByService,
        bookingsByMonth,
        servicePerformance
      });
    }
  }, [bookings, dateRange, services]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Analytics Dashboard</h3>
        <div>
          <select
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Total Revenue</h5>
              <h2 className="display-6">{formatPrice(stats.revenue)}</h2>
              <p className="mb-0">For the selected period</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Completed Bookings</h5>
              <h2 className="display-6">{stats.completedBookings}</h2>
              <p className="mb-0">Successfully delivered</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Pending Bookings</h5>
              <h2 className="display-6">{stats.pendingBookings}</h2>
              <p className="mb-0">To be completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white h-100">
            <div className="card-body">
              <h5 className="card-title">Cancelled Bookings</h5>
              <h2 className="display-6">{stats.cancelledBookings}</h2>
              <p className="mb-0">Missed opportunities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Monthly Trends</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }} className="d-flex align-items-end justify-content-around">
                {stats.bookingsByMonth.map((item, index) => (
                  <div key={index} className="d-flex flex-column align-items-center" style={{ width: `${100 / stats.bookingsByMonth.length}%` }}>
                    <div 
                      className="bg-primary rounded-top" 
                      style={{ 
                        width: '30px', 
                        height: `${Math.max(30, item.count * 50)}px`,
                        maxHeight: '250px'
                      }}
                    ></div>
                    <div className="mt-2 text-center">
                      <div>{item.month}</div>
                      <div><strong>{item.count}</strong> bookings</div>
                      <div className="small">{formatPrice(item.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Service Performance</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Bookings</th>
                      <th>Completed</th>
                      <th>Cancelled</th>
                      <th>Completion Rate</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.servicePerformance.map(service => (
                      <tr key={service.serviceId}>
                        <td>{service.title}</td>
                        <td>{service.totalBookings}</td>
                        <td>{service.completed}</td>
                        <td>{service.cancelled}</td>
                        <td>
                          <div className="progress" style={{ height: '5px' }}>
                            <div 
                              className="progress-bar" 
                              style={{ width: `${service.completionRate}%` }}
                              role="progressbar" 
                              aria-valuenow={service.completionRate} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            ></div>
                          </div>
                          <small>{service.completionRate}%</small>
                        </td>
                        <td>{formatPrice(service.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Top Services by Revenue</h5>
            </div>
            <div className="card-body">
              {stats.revenueByService.length > 0 ? (
                <div className="list-group">
                  {stats.revenueByService.slice(0, 5).map(service => (
                    <div key={service.serviceId} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{service.title}</h6>
                        <span className="badge bg-success">{formatPrice(service.revenue)}</span>
                      </div>
                      <small>{service.bookings} bookings</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No revenue data available for the selected period.</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Performance Summary</h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-column h-100 justify-content-center">
                {bookings.length > 0 ? (
                  <>
                    <div className="mb-3">
                      <h6>Booking Completion Rate</h6>
                      <div className="progress mb-2" style={{ height: '20px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          role="progressbar" 
                          style={{ width: `${stats.completedBookings / bookings.length * 100}%` }}
                          aria-valuenow={stats.completedBookings / bookings.length * 100} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        >
                          {Math.round(stats.completedBookings / bookings.length * 100)}%
                        </div>
                      </div>
                      <small className="text-muted">
                        {stats.completedBookings} completed out of {bookings.length} total bookings
                      </small>
                    </div>
                    <div>
                      <h6>Booking Cancellation Rate</h6>
                      <div className="progress mb-2" style={{ height: '20px' }}>
                        <div 
                          className="progress-bar bg-danger" 
                          role="progressbar" 
                          style={{ width: `${stats.cancelledBookings / bookings.length * 100}%` }}
                          aria-valuenow={stats.cancelledBookings / bookings.length * 100} 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        >
                          {Math.round(stats.cancelledBookings / bookings.length * 100)}%
                        </div>
                      </div>
                      <small className="text-muted">
                        {stats.cancelledBookings} cancelled out of {bookings.length} total bookings
                      </small>
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-center">No booking data available to calculate performance metrics.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
