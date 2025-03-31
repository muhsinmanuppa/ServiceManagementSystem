import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Sidebar from '../../components/provider/Sidebar';
import ProviderRoutes from '../../routes/ProviderRoutes';

const ProviderLayout = () => {
  const { user } = useSelector(state => state.auth);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="d-flex">
      <Sidebar />
      <main className="flex-grow-1 p-4">
        <ProviderRoutes />
      </main>
    </div>
  );
};

export default ProviderLayout;