import React from 'react';
import { Wifi, WifiOff, MessageCircle, AlertTriangle, CheckCircle2, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HealthCards({ health, config }) {
  const bridgeOnline = health?.bridge_online || false;
  const lastCheck = health?.last_bridge_health_check ? format(new Date(health.last_bridge_health_check), 'h:mm a') : 'Never';
  const overallStatus = health?.overall_status || 'offline';
  const hasActiveSession = !!health?.active_session_id;

  const statusColors = {
    healthy: 'text-emerald-400',
    degraded: 'text-amber-400',
    offline: 'text-red-400',
    error: 'text-red-400',
  };

  const cards = [
    {
      label: 'Bridge',
      value: bridgeOnline ? 'Online' : 'Offline',
      icon: bridgeOnline ? Wifi : WifiOff,
      color: bridgeOnline ? 'text-emerald-400' : 'text-red-400',
      sub: `Last check: ${lastCheck}`,
    },
    {
      label: 'System',
      value: overallStatus,
      icon: overallStatus === 'healthy' ? CheckCircle2 : overallStatus === 'degraded' ? AlertTriangle : Activity,
      color: statusColors[overallStatus] || 'text-muted-foreground',
      sub: `${health?.active_task_count || 0} active · ${health?.queued_task_count || 0} queued`,
    },
    {
      label: 'Session',
      value: hasActiveSession ? 'Active' : 'Idle',
      icon: hasActiveSession ? CheckCircle2 : Clock,
      color: hasActiveSession ? 'text-primary' : 'text-muted-foreground',
      sub: hasActiveSession ? 'Session running' : 'No active session',
    },
    {
      label: 'Approval Mode',
      value: (config?.approval_mode || 'ask_first').replace(/_/g, ' '),
      icon: MessageCircle,
      color: 'text-accent',
      sub: `WhatsApp: ${(config?.whatsapp_rules || 'daily_summary').replace(/_/g, ' ')}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-4 h-4', card.color)} />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-sm font-semibold text-foreground capitalize">{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}