import { Outlet } from 'react-router';
import { BottomNav } from '../components/BottomNav';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] pb-20">
      <Outlet />
      <BottomNav type="admin" />
    </div>
  );
};
