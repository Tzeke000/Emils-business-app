import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mouse, Keyboard, Monitor, Camera, Globe, FileText, DollarSign, ShieldAlert, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const actionIcons = {
  mouse_click: Mouse, keyboard_input: Keyboard, window_focus: Monitor,
  screenshot: Camera, ocr_read: Camera, app_open: Monitor,
  browser_navigate: Globe, file_operation: FileText, api_call: Globe,
  task_update: FileText, earning_logged: DollarSign, approval_request: ShieldAlert,
  error: XCircle, other: FileText,
};

const resultColors = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pending: 'bg-primary/10 text-primary border-primary/20',
  skipped: 'bg-muted text-muted-foreground border-border',
};

export default function ActivityLog() {
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');

  const { data: logs = [] } = useQuery({
    queryKey: ['activityLog'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 200),
  });

  const filtered = logs.filter(l => {
    const typeMatch = filterType === 'all' || l.action_type === filterType;
    const resultMatch = filterResult === 'all' || l.result === filterResult;
    return typeMatch && resultMatch;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Proof of every action Emil takes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="mouse_click">Mouse Click</SelectItem>
            <SelectItem value="keyboard_input">Keyboard</SelectItem>
            <SelectItem value="window_focus">Window Focus</SelectItem>
            <SelectItem value="screenshot">Screenshot</SelectItem>
            <SelectItem value="browser_navigate">Browser</SelectItem>
            <SelectItem value="api_call">API Call</SelectItem>
            <SelectItem value="task_update">Task Update</SelectItem>
            <SelectItem value="earning_logged">Earning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterResult} onValueChange={setFilterResult}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">No activity logged yet. Emil will log actions as she works.</div>
        ) : filtered.map((log) => {
          const Icon = actionIcons[log.action_type] || FileText;
          return (
            <div key={log.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary shrink-0 mt-0.5"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{log.description}</p>
                  {log.command_sent && <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{log.command_sent}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className={cn('text-[10px] border', resultColors[log.result] || resultColors.pending)}>{log.result || 'pending'}</Badge>
                    {log.confidence != null && <span className="text-[10px] text-muted-foreground">{Math.round(log.confidence * 100)}% confidence</span>}
                    {log.app_window && <Badge variant="secondary" className="text-[10px] bg-secondary text-muted-foreground border-border">{log.app_window}</Badge>}
                    {log.error_message && <span className="text-[10px] text-red-400 truncate max-w-[200px]">{log.error_message}</span>}
                    <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(log.created_date), 'MMM d, h:mm:ss a')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}