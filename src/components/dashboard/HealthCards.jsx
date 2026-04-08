import React from 'react';
import { Wifi, WifiOff, MessageCircle, Camera, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HealthCards({ lastLog, lastSession, config }) {
  const bridgeActive = lastLog && (new Date() - new Date(lastLog.created_date)) < 300000; // 5 min
  const lastAction = lastLog ? format(new Date(lastLog.created_date), 'h:mm a') : 'Never';
  const lastResult = lastLog?.result || 'none';
  const hasActiveSession = lastSession?.status === 'active';
  const pendingFailures = 0; // Could be computed from logs

  const cards = [
    {
      label: 'Bridge',
      value: bridgeActive ? 'Online' : 'Offline',
      icon: bridgeActive ? Wifi : WifiOff,
      color: bridgeActive ? 'text-emerald-400' : 'text-red-400',
      sub: `Last: ${lastAction}`,
    },
    {
      label: 'Last Result',
      value: lastResult,
      icon: lastResult === 'success' ? CheckCircle2 : lastResult === 'failed' ? AlertTriangle : Clock,
      color: lastResult === 'success' ? 'text-emerald-400' : lastResult === 'failed' ? 'text-red-400' : 'text-muted-foreground',
      sub: lastLog?.action_type?.replace('_', ' ') || 'No actions',
    },
    {
      label: 'Session',
      value: hasActiveSession ? 'Active' : 'Idle',
      icon: hasActiveSession ? CheckCircle2 : Clock,
      color: hasActiveSession ? 'text-primary' : 'text-muted-foreground',
      sub: lastSession?.objective?.slice(0, 30) || 'No session',
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