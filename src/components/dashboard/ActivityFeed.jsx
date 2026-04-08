import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusIcons = {
  completed: { icon: CheckCircle2, color: 'text-emerald-400' },
  in_progress: { icon: Clock, color: 'text-amber-400' },
  failed: { icon: AlertCircle, color: 'text-red-400' },
  queued: { icon: Moon, color: 'text-primary' },
};

export default function ActivityFeed({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground text-center py-8">No activity yet. Start chatting with Emil!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {tasks.slice(0, 8).map((task) => {
          const { icon: StatusIcon, color } = statusIcons[task.status] || statusIcons.queued;
          return (
            <div key={task.id} className="flex items-start gap-3 group">
              <StatusIcon className={cn('w-4 h-4 mt-0.5 shrink-0', color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{task.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {task.category?.replace('_', ' ')} · {format(new Date(task.created_date), 'MMM d, h:mm a')}
                </p>
              </div>
              {task.revenue_generated > 0 && (
                <span className="text-xs font-medium text-emerald-400">+${task.revenue_generated}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}