import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Moon, Ban, User, RotateCcw, Trash2, Play } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskForm from '../components/tasks/TaskForm';

const statusConfig = {
  queued: { label: 'Queued', icon: Moon, color: 'bg-primary/10 text-primary border-primary/20' },
  active: { label: 'Active', icon: Play, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  blocked: { label: 'Blocked', icon: Ban, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  waiting_on_user: { label: 'Waiting on You', icon: User, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  abandoned: { label: 'Abandoned', icon: Trash2, color: 'bg-muted text-muted-foreground border-border' },
  retried: { label: 'Retried', icon: RotateCcw, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.AgentTask.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AgentTask.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AgentTask.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Full lifecycle tracking for Emil's work</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Task</Button>
      </div>

      {showForm && <TaskForm onSubmit={(data) => createMutation.mutate(data)} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-10 bg-card border-border" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="waiting_on_user">Waiting on You</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
            <SelectItem value="retried">Retried</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No tasks found.</div>
        ) : filtered.map((task) => {
          const config = statusConfig[task.status] || statusConfig.queued;
          const StatusIcon = config.icon;
          return (
            <div key={task.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start gap-3">
                <StatusIcon className={cn('w-5 h-5 mt-0.5 shrink-0', config.color.split(' ')[1])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium text-foreground', task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</p>
                    {task.requires_approval && task.approval_status === 'pending' && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-emerald-400 border-emerald-500/30" onClick={() => updateMutation.mutate({ id: task.id, data: { approval_status: 'approved' } })}>Approve</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] text-red-400 border-red-500/30" onClick={() => updateMutation.mutate({ id: task.id, data: { approval_status: 'rejected' } })}>Reject</Button>
                      </div>
                    )}
                  </div>
                  {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  {task.blocker_reason && <p className="text-xs text-red-400 mt-1">⚠ {task.blocker_reason}</p>}
                  {task.result_summary && <p className="text-xs text-emerald-400 mt-1">✓ {task.result_summary}</p>}
                  {task.next_step && <p className="text-xs text-primary mt-1">→ {task.next_step}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className={cn('text-[10px] border', config.color)}>{config.label}</Badge>
                    {task.source && task.source !== 'user_request' && (
                      <Badge variant="secondary" className="text-[10px] bg-secondary text-muted-foreground border-border">{task.source.replace('_', ' ')}</Badge>
                    )}
                    {task.category && (
                      <Badge variant="secondary" className="text-[10px] bg-secondary text-muted-foreground border-border">{task.category.replace('_', ' ')}</Badge>
                    )}
                    {task.priority && task.priority !== 'medium' && (
                      <Badge variant="secondary" className={cn('text-[10px] border',
                        task.priority === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : task.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-secondary text-muted-foreground border-border'
                      )}>{task.priority}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(task.created_date), 'MMM d')}</span>
                  </div>
                </div>
                {task.revenue_generated > 0 && <span className="text-sm font-semibold text-emerald-400 shrink-0">+${task.revenue_generated}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}