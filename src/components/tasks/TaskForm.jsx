import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

export default function TaskForm({ onSubmit, onCancel }) {
  const [task, setTask] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    status: 'queued',
    source: 'user_request',
    requires_approval: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title.trim()) return;
    onSubmit(task);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 mb-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Task title..."
          value={task.title}
          onChange={(e) => setTask({ ...task, title: e.target.value })}
          className="bg-secondary border-border"
        />
        <Textarea
          placeholder="Description (optional)"
          value={task.description}
          onChange={(e) => setTask({ ...task, description: e.target.value })}
          className="bg-secondary border-border h-20"
        />
        <div className="flex flex-wrap gap-3">
          <Select value={task.category} onValueChange={(v) => setTask({ ...task, category: v })}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="content_creation">Content</SelectItem>
              <SelectItem value="outreach">Outreach</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="desktop_control">Desktop Control</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={task.priority} onValueChange={(v) => setTask({ ...task, priority: v })}>
            <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={task.requires_approval} onCheckedChange={(v) => setTask({ ...task, requires_approval: v })} />
          <Label className="text-xs text-muted-foreground">Require your approval before Emil executes</Label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Create Task</Button>
        </div>
      </form>
    </motion.div>
  );
}