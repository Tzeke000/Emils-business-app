import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, ListTodo, TrendingUp, Moon, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import EarningsChart from '../components/dashboard/EarningsChart';
import HealthCards from '../components/dashboard/HealthCards';
import EmilMindCard from '../components/dashboard/EmilMindCard';

export default function Dashboard() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.AgentTask.list('-created_date', 50),
  });
  const { data: earnings = [] } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => base44.entities.Earning.list('-created_date', 50),
  });
  const { data: healthRecords = [] } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => base44.entities.SystemHealth.list('-updated_date', 1),
  });
  const { data: configs = [] } = useQuery({
    queryKey: ['agentConfig'],
    queryFn: () => base44.entities.AgentConfig.list(),
  });
  const { data: memory = [] } = useQuery({
    queryKey: ['emilMemory'],
    queryFn: () => base44.entities.EmilMemory.list(),
  });

  const totalEarnings = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = tasks.filter(t => t.status === 'active').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked' || t.status === 'waiting_on_user').length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor Emil's operations</p>
      </div>

      <div className="mb-6">
        <HealthCards health={healthRecords[0] || null} config={configs[0] || null} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} icon={DollarSign} trend="+12%" trendUp={true} />
        <StatCard title="Pending Payout" value={`$${pendingEarnings.toFixed(2)}`} icon={TrendingUp} subtitle="Awaiting confirmation" />
        <StatCard title="Tasks Completed" value={completedTasks} icon={ListTodo} subtitle={`${activeTasks} active · ${blockedTasks} blocked`} />
        <StatCard title="Emil Status" value={configs[0]?.is_active !== false ? 'Active' : 'Paused'} icon={Moon} subtitle={configs[0]?.approval_mode?.replace(/_/g, ' ') || 'ask first'} />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><EarningsChart earnings={earnings} /></div>
        <div className="lg:col-span-2 space-y-6">
          <EmilMindCard memory={memory} />
          <ActivityFeed tasks={tasks} />
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Link to="/chat" className="block bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Moon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Talk to Emil</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Give Emil a task, strategy, or objective</p>
            </div>
          </div>
        </Link>
        <a href={base44.agents.getWhatsAppConnectURL('openClawAgent')} target="_blank" rel="noopener noreferrer" className="block bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Connect WhatsApp</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Get updates from Emil directly</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}