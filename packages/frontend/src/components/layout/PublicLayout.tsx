import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
