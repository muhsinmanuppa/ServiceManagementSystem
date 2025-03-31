import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ClientSidebar from '../../components/client/Sidebar';
import Dashboard from './Dashboard';
import Bookings from './Bookings';
import Services from './Services';
import Profile from './Profile';

const ClientLayout = () => {
  const { user } = useSelector(state => state.auth);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="d-flex">
      <ClientSidebar />
      <main className="flex-grow-1 p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/services" element={<Services />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
};

export default ClientLayout;
