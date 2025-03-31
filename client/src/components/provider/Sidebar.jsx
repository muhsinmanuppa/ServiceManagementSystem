import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Add handleLogout function
  const handleLogout = async () => {
    try {
      await dispatch(logout());
      // Navigate to login page after logout
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get verification status with proper fallback
  const verificationStatus = user?.verificationStatus?.status || 'unverified';

  // Helper function to get badge properties
  const getBadgeProps = (status) => {
    switch (status) {
      case 'verified':
        return { class: 'bg-success', icon: '✓', text: 'Verified' };
      case 'pending':
        return { class: 'bg-warning text-dark', icon: '⏳', text: 'Under Review' };
      case 'rejected':
        return { class: 'bg-danger', icon: '✕', text: 'Rejected' };
      default:
        return { class: 'bg-secondary', icon: '!', text: 'Not Verified' };
    }
  };

  const badge = getBadgeProps(verificationStatus);

  const menuItems = [
    { path: '/provider', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/provider/services', icon: 'bi-grid', label: 'My Services' },
    { path: '/provider/bookings', icon: 'bi-calendar-check', label: 'Bookings' },
    { path: '/provider/profile', icon: 'bi-person', label: 'Profile' }
  ];

  return (
    <div className="bg-light border-end" style={{ width: '280px', minHeight: '100vh' }}>
      <div className="p-3">
        <div className="text-center mb-4">
          <h5 className="mb-2">{user?.name}</h5>
          <div className={`badge ${badge.class}`}>
            {badge.icon} {badge.text}
          </div>
          {verificationStatus === 'rejected' && (
            <small className="d-block text-danger mt-1">
              <Link to="/provider/profile" className="text-danger">
                <i className="bi bi-exclamation-circle me-1"></i>
                Update verification
              </Link>
            </small>
          )}
          {verificationStatus === 'unverified' && (
            <small className="d-block text-muted mt-1">
              <Link to="/provider/profile" className="text-muted">
                <i className="bi bi-shield-check me-1"></i>
                Verify account
              </Link>
            </small>
          )}
        </div>
        
        <div className="list-group list-group-flush">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`list-group-item list-group-item-action ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="list-group-item list-group-item-action text-danger mt-2"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
