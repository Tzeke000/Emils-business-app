import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, ListTodo, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import EarningsChart from '../components/dashboard/EarningsChart';

export default function Dashboard() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.AgentTask.list('-created_date', 50),
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => base44.entities.Earning.list('-created_date', 50),
  });

  const totalEarnings = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor your AI agent's business operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Earnings"
          value={`$${totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Pending Payout"
          value={`$${pendingEarnings.toFixed(2)}`}
          icon={TrendingUp}
          subtitle="Awaiting confirmation"
        />
        <StatCard
          title="Tasks Completed"
          value={completedTasks}
          icon={ListTodo}
          subtitle={`${activeTasks} in progress`}
        />
        <StatCard
          title="Agent Status"
          value="Active"
          icon={Zap}
          subtitle="Ready for commands"
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <EarningsChart earnings={earnings} />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed tasks={tasks} />
        </div>
      </div>

      {/* Quick Action */}
      <div className="mt-6">
        <Link
          to="/chat"
          className="block bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Talk to your agent</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Give it a business goal, task, or strategy to execute</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}