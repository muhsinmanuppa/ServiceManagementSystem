import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';

const DashboardRedirect = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role) {
      const path = getDefaultPath(user.role);
      navigate(path, { replace: true });
    }
  }, [user, navigate]);

  const getDefaultPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'provider':
        return '/provider/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/';
    }
  };

  return <LoadingSpinner />;
};

export default DashboardRedirect;
