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
    { to: '/client/profile', text: 'Profile', icon: 'user' }
  ];

  return (
    <div className="d-flex h-100">
      <div className="sidebar-container" style={{ minWidth: sidebarCollapsed ? '64px' : '280px', width: sidebarCollapsed ? '64px' : '280px' }}>
        <Sidebar
          navItems={navItems}
          collapsed={sidebarCollapsed}
        />
      </div>
      <div className="content-wrapper flex-grow-1 overflow-hidden">
        <Header
          toggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="content overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;