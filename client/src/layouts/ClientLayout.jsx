import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ClientLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const navItems = [
    { to: '/client/dashboard', text: 'Dashboard', icon: 'dashboard' },
    { to: '/client/services', text: 'Services', icon: 'concierge-bell' },
    { to: '/client/bookings', text: 'My Bookings', icon: 'calendar-check' },
    // Favorites link removed
    { to: '/client/profile', text: 'Profile', icon: 'user' }
  ];

  return (
    <div className="d-flex">
      <Sidebar
        navItems={navItems}
        collapsed={sidebarCollapsed}
      />
      <div className="content-wrapper">
        <Header
          toggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;