import { Route, Routes } from 'react-router-dom';
import ClientBookingDetail from '../pages/client/BookingDetail';
import ProviderBookingDetail from '../pages/provider/BookingDetail';
import AdminBookings from '../pages/admin/Bookings';
import ClientBookings from '../pages/client/Bookings';
import ProviderBookings from '../pages/provider/Bookings';
import AuthGuard from '../components/AuthGuard';

const BookingRoutes = () => {
  return (
    <Routes>
      {/* Client booking routes */}
      <Route 
        path="/client/bookings" 
        element={
          <AuthGuard allowedRoles={["client"]}>
            <ClientBookings />
          </AuthGuard>
        } 
      />
      {/* Update this route to match the link in ClientBookings */}
      <Route 
        path="/client/bookings/:id" 
        element={
          <AuthGuard allowedRoles={["client"]}>
            <ClientBookingDetail />
          </AuthGuard>
        } 
      />

      {/* Provider booking routes */}
      <Route 
        path="provider/bookings" 
        element={
          <AuthGuard allowedRoles={["provider"]}>
            <ProviderBookings />
          </AuthGuard>
        } 
      />
      <Route 
        path="provider/bookings/:id" 
        element={
          <AuthGuard allowedRoles={["provider"]}>
            <ProviderBookingDetail />
          </AuthGuard>
        } 
      />

      {/* Admin booking routes */}
      <Route 
        path="admin/bookings" 
        element={
          <AuthGuard allowedRoles={["admin"]}>
            <AdminBookings />
          </AuthGuard>
        } 
      />
    </Routes>
  );
};

export default BookingRoutes;
