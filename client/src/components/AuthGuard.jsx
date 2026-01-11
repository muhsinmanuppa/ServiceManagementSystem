import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { startTransition, Suspense } from 'react';

const AuthGuard = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();

  const isProfilePath = location.pathname.includes('/profile');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (isProfilePath) {
    const correctPath = `/${user.role}/profile`;
    if (location.pathname !== correctPath) {
      return <Navigate to={correctPath} />;
    }
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={`/${user.role}`} />;
  }

  return children;
};

const getDefaultPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'provider':
      return '/provider';
    case 'client':
      return '/client';
    default:
      return '/';
  }
};

export default AuthGuard;
