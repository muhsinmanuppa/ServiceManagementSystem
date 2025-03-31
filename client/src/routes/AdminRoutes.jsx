import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/admin/Dashboard';
import ProviderList from '../pages/admin/ProviderList';
import ProviderVerification from '../pages/admin/ProviderVerification';
import UserManager from '../pages/admin/UserManager';
import CategoryManagement from '../pages/admin/CategoryManagement'; // Update import
import Analytics from '../pages/admin/Analytics';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="list" element={<ProviderList />} />
      <Route path="provider-verifications" element={<ProviderVerification />} />
      <Route path="users" element={<UserManager />} />
      <Route path="categories" element={<CategoryManagement />} /> {/* Update component */}
      <Route path="analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
