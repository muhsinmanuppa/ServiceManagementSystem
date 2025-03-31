import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Dashboard from '../pages/provider/Dashboard';
import Services from '../pages/provider/Services';
import Profile from '../pages/provider/Profile';
import AddService from '../pages/provider/AddService';
import EditService from '../pages/provider/EditService';
import ProviderBookings from '../pages/bookings/ProviderBookings';
import BookingDetail from '../pages/provider/BookingDetail';
import ErrorBoundary from '../components/ErrorBoundary';

const VerifiedRoute = ({ children }) => {
  const { user } = useSelector(state => state.auth);
  const isVerified = user?.verificationStatus?.status === 'verified';

  if (!isVerified) {
    return (
      <div className="alert alert-warning">
        <h4>⚠️ Verification Required</h4>
        <p>Your profile needs to be verified to access this feature.</p>
        <a href="/provider/profile" className="btn btn-primary">
          Complete Verification
        </a>
      </div>
    );
  }

  return children;
};

const ProviderRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="services" element={
        <VerifiedRoute>
          <Services />
        </VerifiedRoute>
      } />
      <Route path="services/add" element={
        <VerifiedRoute>
          <ErrorBoundary>
            <AddService />
          </ErrorBoundary>
        </VerifiedRoute>
      } />
      <Route path="services/edit/:id" element={
        <VerifiedRoute>
          <ErrorBoundary>
            <EditService />
          </ErrorBoundary>
        </VerifiedRoute>
      } />
    
      <Route path="profile" element={<Profile />} />
      <Route path="bookings" element={<ProviderBookings />} />
      <Route path="bookings/:id" element={<BookingDetail />} />
    </Routes>
  );
};

export default ProviderRoutes;
