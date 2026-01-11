import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react'; // ✅ added useEffect
import { logout } from '../../store/slices/authSlice';

const ProviderSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const verificationStatus = user?.verificationStatus?.status || 'unverified';

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

  useEffect(() => {
    if (verificationStatus !== 'verified' && location.pathname !== '/provider/profile') {
      navigate('/provider/profile', { replace: true });
    }
  }, [verificationStatus, location.pathname, navigate]);

  const filteredMenuItems =
    verificationStatus === 'verified'
      ? menuItems
      : menuItems.filter(item => item.path === '/provider/profile');

  return (
    <>

      <button 
        className="d-md-none btn btn-primary position-fixed top-0 start-0 mt-2 ms-2"
        onClick={toggleSidebar}
        style={{ zIndex: 1030 }}
      >
        <i className={`bi ${collapsed ? 'bi-list' : 'bi-x'}`}></i>
      </button>

      {!collapsed && (
        <div
          className="position-fixed d-md-none"
          onClick={toggleSidebar}
          style={{
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1020
          }}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`bg-dark text-light shadow-lg ${collapsed ? 'd-none d-md-block' : ''}`}
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
                <div className={`badge ${badge.class} mt-1`} style={{ fontSize: '0.75rem' }}>
                  {badge.icon} {badge.text}
                </div>
              </div>
            )}
            <button
              className="btn btn-sm text-white-50 ms-auto d-none d-md-block"
              onClick={toggleSidebar}
            >
              <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
            </button>
          </div>

          {!collapsed && (
            <>
              {verificationStatus === 'rejected' && (
                <small className="d-block text-danger mb-2">
                  <Link to="/provider/profile" className="text-danger">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    Update verification
                  </Link>
                </small>
              )}
              {verificationStatus === 'unverified' && (
                <small className="d-block text-muted mb-2">
                  <Link to="/provider/profile" className="text-muted">
                    <i className="bi bi-shield-check me-1"></i>
                    Verify account
                  </Link>
                </small>
              )}
            </>
          )}

          <div className="nav flex-column">
            {filteredMenuItems.map((item) => (   // ✅ use filteredMenuItems
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

export default ProviderSidebar;
