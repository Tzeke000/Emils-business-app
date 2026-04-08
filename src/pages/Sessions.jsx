import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Pause, XCircle, Target, DollarSign, ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  active: { label: 'Active', icon: Clock, color: 'bg-primary/10 text-primary border-primary/20' },
  paused: { label: 'Paused', icon: Pause, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  aborted: { label: 'Aborted', icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function Sessions() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.WorkSession.list('-created_date', 50),
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Work Sessions</h1>
        <p className="text-sm text-muted-foreground mt-1">Emil's grouped work blocks with objectives and outcomes</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">No sessions yet. Emil will create sessions as she works.</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const cfg = statusConfig[session.status] || statusConfig.active;
            const StatusIcon = cfg.icon;
            return (
              <div key={session.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10"><Target className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{session.objective || 'Untitled Session'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {session.started_at ? format(new Date(session.started_at), 'MMM d, h:mm a') : format(new Date(session.created_date), 'MMM d, h:mm a')}
                        {session.ended_at && ` → ${format(new Date(session.ended_at), 'h:mm a')}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn('text-[10px] border', cfg.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" />{cfg.label}
                  </Badge>
                </div>
                {session.summary && <p className="text-xs text-muted-foreground mb-3 bg-secondary/50 rounded-lg p-3">{session.summary}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" />{session.tasks_completed || 0}/{session.tasks_touched || 0} tasks</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${(session.earnings_generated || 0).toFixed(2)}</span>
                  {session.whatsapp_summary_sent && <span className="text-emerald-400">✓ WhatsApp sent</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}