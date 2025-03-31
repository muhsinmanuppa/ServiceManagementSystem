import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Notification from '../components/Notification';

const HomeLayout = () => {
  return (
    <div>
      <Navbar />
      <Notification />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;
