import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, ListTodo, DollarSign, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'Agent Chat', icon: MessageSquare },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/earnings', label: 'Earnings', icon: DollarSign },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">OpenClaw</h1>
          <p className="text-[11px] text-muted-foreground font-mono">AI AGENT PLATFORM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-foreground">Agent Online</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Ready to execute tasks</p>
      </div>
    </aside>
  );
}