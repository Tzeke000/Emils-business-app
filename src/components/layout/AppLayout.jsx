import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Mobile nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>
      {/* Main content */}
      <main className="md:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}