import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from '../pages/client/Dashboard';
import Services from '../pages/client/Services';
import Profile from '../pages/client/Profile';
import Settings from '../pages/client/Settings';
import Reviews from '../pages/client/Reviews';
import Help from '../pages/client/Help';
import ClientBookings from '../pages/client/Bookings';
import BookingDetail from '../pages/client/BookingDetail';

const ClientRoutes = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="services" element={<Services />} />
      <Route path="bookings" element={<ClientBookings />} />
      <Route path="bookings/:id" element={<BookingDetail />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      <Route path="reviews" element={<Reviews />} />
      <Route path="help" element={<Help />} />
    </Routes>
  );
};

export default ClientRoutes;
