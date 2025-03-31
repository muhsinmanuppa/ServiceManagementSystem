import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';

const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const menuItems = [
    { path: '/client', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/client/services', icon: 'bi-grid', label: 'Browse Services' },
    { path: '/client/bookings', icon: 'bi-calendar-check', label: 'My Bookings' },
    { path: '/client/profile', icon: 'bi-person', label: 'Profile' }
  ];

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="bg-light border-end" style={{ width: '280px', minHeight: '100vh' }}>
      <div className="p-3">
        <div className="text-center mb-4">
          <h5>{user?.name}</h5>
          <div className="text-muted small">Client Account</div>
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
          
          {/* Add Logout Button */}
          <button
            onClick={handleLogout}
            className="list-group-item list-group-item-action text-danger"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientSidebar;
