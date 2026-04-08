import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskForm from '../components/tasks/TaskForm';

const statusConfig = {
  queued: { label: 'Queued', icon: Zap, color: 'bg-primary/10 text-primary border-primary/20' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
    },
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
          <p className="text-sm text-muted-foreground mt-1">Agent work items and their status</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {showForm && (
        <TaskForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No tasks found. The agent will create tasks as it works on your goals.
          </div>
        ) : (
          filtered.map((task) => {
            const config = statusConfig[task.status] || statusConfig.queued;
            const StatusIcon = config.icon;
            return (
              <div
                key={task.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const next = task.status === 'queued' ? 'in_progress'
                        : task.status === 'in_progress' ? 'completed' : task.status;
                      if (next !== task.status) updateMutation.mutate({ id: task.id, data: { status: next } });
                    }}
                    className="mt-0.5"
                  >
                    <StatusIcon className={cn('w-5 h-5', config.color.split(' ')[1])} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium text-foreground', task.status === 'completed' && 'line-through text-muted-foreground')}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary" className={cn('text-[10px] border', config.color)}>
                        {config.label}
                      </Badge>
                      {task.category && (
                        <Badge variant="secondary" className="text-[10px] bg-secondary text-muted-foreground border-border">
                          {task.category.replace('_', ' ')}
                        </Badge>
                      )}
                      {task.priority && (
                        <Badge variant="secondary" className={cn('text-[10px] border',
                          task.priority === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : task.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-secondary text-muted-foreground border-border'
                        )}>
                          {task.priority}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {format(new Date(task.created_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  {task.revenue_generated > 0 && (
                    <span className="text-sm font-semibold text-emerald-400">+${task.revenue_generated}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}