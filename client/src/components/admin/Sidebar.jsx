import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminSidebar = () => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: '/admin', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/admin/list', icon: 'bi-people', label: 'Users' },
    { path: '/admin/provider-verifications', icon: 'bi-shield-check', label: 'Provider Verifications' }
    ,
    { path: '/admin/categories', icon: 'bi-grid', label: 'Categories' }
  ];

  return (
    <div className="bg-dark" style={{ width: '280px', minHeight: '100vh' }}>
      <div className="p-3">
        <div className="text-center mb-4">
          <h5 className="text-white">{user?.name}</h5>
          <div className="badge bg-danger">Admin Panel</div>
        </div>
        
        <div className="nav flex-column">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link text-white py-3 ${
                isActive(item.path) 
                  ? 'bg-primary rounded active' 
                  : 'opacity-75 hover-opacity-100'
              }`}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
              {item.badge && (
                <span className={`badge bg-${item.badge.type} float-end`}>
                  {item.badge.content}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
