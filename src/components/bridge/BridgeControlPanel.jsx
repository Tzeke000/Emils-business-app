import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Play, Square, RotateCw, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusConfig = {
  running: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Running' },
  stopped: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Stopped' },
  starting: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Starting...' },
  stopping: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Stopping...' },
  restarting: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Restarting...' },
  crashed: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Crashed' },
  unknown: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Unknown' },
};

export default function BridgeControlPanel({ health, compact = false }) {
  const queryClient = useQueryClient();
  const bridgeStatus = health?.bridge_status || 'unknown';
  const bridgeOnline = health?.bridge_online || false;
  const lastHealthOk = health?.bridge_last_health_ok_at;
  const lastRestartResult = health?.bridge_last_restart_result || 'none';
  const restartCount24h = health?.bridge_restart_attempt_count_24h || 0;
  const watchdog = health?.watchdog_state || 'disabled';
  const pid = health?.bridge_listener_pid;

  const cfg = statusConfig[bridgeStatus] || statusConfig.unknown;

  const sendCommand = useMutation({
    mutationFn: async ({ command_type, reason }) => {
      await base44.entities.BridgeCommand.create({
        command_type,
        requested_by: 'user',
        reason: reason || `User requested ${command_type}`,
        status: 'queued',
        requested_at: new Date().toISOString(),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bridgeCommands'] });
      toast.success(`Bridge ${vars.command_type} command queued`);
    },
  });

  const isTransitioning = ['starting', 'stopping', 'restarting'].includes(bridgeStatus);
  const isSending = sendCommand.isPending;

  if (compact) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {bridgeOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            <h3 className="text-sm font-semibold text-foreground">Bridge</h3>
          </div>
          <Badge className={cn('text-[10px]', cfg.bg, cfg.color)}>{cfg.label}</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={isTransitioning || isSending || bridgeStatus === 'running'}
            onClick={() => sendCommand.mutate({ command_type: 'start' })}>
            <Play className="w-3 h-3" /> Start
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={isTransitioning || isSending || bridgeStatus === 'stopped'}
            onClick={() => sendCommand.mutate({ command_type: 'stop' })}>
            <Square className="w-3 h-3" /> Stop
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={isTransitioning || isSending}
            onClick={() => sendCommand.mutate({ command_type: 'restart' })}>
            {isTransitioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />} Restart
          </Button>
        </div>
        {restartCount24h > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">{restartCount24h} restart(s) in last 24h</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-primary/10">
          {bridgeOnline ? <Wifi className="w-5 h-5 text-primary" /> : <WifiOff className="w-5 h-5 text-red-400" />}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Bridge Control</h2>
          <p className="text-xs text-muted-foreground">Desktop control bridge lifecycle</p>
        </div>
        <Badge className={cn('ml-auto text-xs', cfg.bg, cfg.color)}>{cfg.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoRow label="Port" value={health?.bridge_port || 47821} />
        <InfoRow label="PID" value={pid || '—'} />
        <InfoRow label="Watchdog" value={watchdog} />
        <InfoRow label="Last Restart" value={
          lastRestartResult === 'none' ? 'Never' :
          lastRestartResult === 'succeeded' ? '✓ OK' :
          lastRestartResult === 'failed' ? '✗ Failed' : 'Pending'
        } />
        <InfoRow label="Restarts (24h)" value={restartCount24h} warn={restartCount24h >= 4} />
        <InfoRow label="Last Health OK" value={lastHealthOk ? format(new Date(lastHealthOk), 'h:mm a') : 'Never'} />
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" className="flex-1 gap-2 text-xs" disabled={isTransitioning || isSending || bridgeStatus === 'running'}
          onClick={() => sendCommand.mutate({ command_type: 'start', reason: 'User started bridge from settings' })}>
          <Play className="w-3.5 h-3.5" /> Start
        </Button>
        <Button variant="outline" className="flex-1 gap-2 text-xs" disabled={isTransitioning || isSending || bridgeStatus === 'stopped'}
          onClick={() => sendCommand.mutate({ command_type: 'stop', reason: 'User stopped bridge from settings' })}>
          <Square className="w-3.5 h-3.5" /> Stop
        </Button>
        <Button variant="outline" className="flex-1 gap-2 text-xs" disabled={isTransitioning || isSending}
          onClick={() => sendCommand.mutate({ command_type: 'restart', reason: 'User restarted bridge from settings' })}>
          {isTransitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />} Restart
        </Button>
      </div>

      <div className="bg-secondary/50 rounded-xl p-3 border border-border">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Commands are queued here and executed by your local bridge supervisor. This app cannot directly control Windows processes — a trusted local companion must be running to pick up and execute these commands.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, warn }) {
  return (
    <div className="bg-secondary/30 rounded-lg px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('text-xs font-medium mt-0.5', warn ? 'text-amber-400' : 'text-foreground')}>{String(value)}</p>
    </div>
  );
}