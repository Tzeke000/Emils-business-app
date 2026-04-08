import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, ListTodo, DollarSign, Settings, Activity, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/earnings', icon: DollarSign, label: 'Earn' },
  { path: '/activity', icon: Activity, label: 'Log' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 safe-area-pb">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}