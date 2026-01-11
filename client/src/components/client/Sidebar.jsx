import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { logout } from '../../store/slices/authSlice';

const ClientSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [collapsed, setCollapsed] = useState(false);

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

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <>
      <button 
        className="d-md-none btn btn-primary position-fixed top-0 start-0 mt-2 ms-2 z-index-1000"
        onClick={toggleSidebar}
        style={{ zIndex: 1030 }}
      >
        <i className={`bi ${collapsed ? 'bi-list' : 'bi-x'}`}></i>
      </button>

      {!collapsed && (
        <div 
          className="position-fixed d-md-none" 
          style={{ 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 1020 
          }}
          onClick={toggleSidebar}
        ></div>
      )}

      <div 
        className={`bg-dark text-light shadow-lg transition-all ${collapsed ? 'd-none d-md-block' : ''}`}
        style={{ 
          width: collapsed ? '80px' : '280px',
          minHeight: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1025,
          transition: 'width 0.3s ease'
        }}
      >
        <div className="p-3">
          <div className="d-flex align-items-center mb-4 pb-3 border-bottom border-secondary">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
              style={{ width: '40px', height: '40px', flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="text-truncate">
                <h6 className="mb-0 text-white">{user?.name}</h6>
                <div className="text-white-50 small">Client Account</div>
              </div>
            )}
            <button 
              className="btn btn-sm text-white-50 ms-auto d-none d-md-block"
              onClick={toggleSidebar}
            >
              <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
          </div>
          
          <div className="nav flex-column">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link py-2 px-3 mb-2 rounded ${
                  location.pathname === item.path 
                    ? 'bg-primary text-white' 
                    : 'text-white-50 hover-bg-secondary'
                }`}
                title={collapsed ? item.label : ''}
              >
                <i className={`bi ${item.icon} ${!collapsed ? 'me-3' : ''}`}></i>
                {!collapsed && item.label}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="nav-link py-2 px-3 mb-2 rounded text-danger border-0 bg-transparent text-start w-100"
              title={collapsed ? 'Logout' : ''}
            >
              <i className={`bi bi-box-arrow-right ${!collapsed ? 'me-3' : ''}`}></i>
              {!collapsed && 'Logout'}
            </button>
          </div>
        </div>
      </div>

      <div className="d-none d-md-block" style={{ width: collapsed ? '80px' : '280px', flexShrink: 0 }}></div>
    </>
  );
};

export default ClientSidebar;