import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminSidebar from '../../components/admin/Sidebar';

const AdminLayout = ({ children }) => {
  const { user } = useSelector(state => state.auth);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="d-flex">
      <AdminSidebar />
      <main className="flex-grow-1 p-4">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;
