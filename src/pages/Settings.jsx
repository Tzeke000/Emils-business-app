import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, Moon, Shield, MessageCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import BridgeControlPanel from '../components/bridge/BridgeControlPanel';

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: configs = [] } = useQuery({
    queryKey: ['agentConfig'],
    queryFn: () => base44.entities.AgentConfig.list(),
  });

  const config = configs[0] || null;
  const { data: healthRecords = [] } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => base44.entities.SystemHealth.list('-updated_date', 1),
  });

  const [form, setForm] = useState({
    agent_name: 'Emil',
    business_goal: '',
    strategy: '',
    approval_mode: 'ask_first',
    whatsapp_rules: 'daily_summary',
    max_messages_per_hour: 3,
    payout_method: 'bank_transfer',
    payout_details: '',
    is_active: true,
    auto_mode: false,
  });

  useEffect(() => {
    if (config) {
      setForm({
        agent_name: config.agent_name || 'Emil',
        business_goal: config.business_goal || '',
        strategy: config.strategy || '',
        approval_mode: config.approval_mode || 'ask_first',
        whatsapp_rules: config.whatsapp_rules || 'daily_summary',
        max_messages_per_hour: config.max_messages_per_hour || 3,
        payout_method: config.payout_method || 'bank_transfer',
        payout_details: config.payout_details || '',
        is_active: config.is_active !== false,
        auto_mode: config.auto_mode || false,
      });
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config) return base44.entities.AgentConfig.update(config.id, data);
      else return base44.entities.AgentConfig.create(data);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agentConfig'] }); toast.success('Settings saved'); },
  });

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure Emil's behavior, approvals, and messaging</p>
      </div>

      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10"><Moon className="w-5 h-5 text-primary" /></div>
            <h2 className="text-sm font-semibold text-foreground">Emil Configuration</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Agent Name</Label>
            <Input value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Business Goal</Label>
            <Textarea value={form.business_goal} onChange={(e) => setForm({ ...form, business_goal: e.target.value })} placeholder="e.g., Build a $10k/month content business" className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Strategy Notes</Label>
            <Textarea value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })} placeholder="How should Emil approach this goal?" className="bg-secondary border-border" />
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-foreground">Agent Active</p><p className="text-xs text-muted-foreground">Enable or disable Emil</p></div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-foreground">Auto Mode</p><p className="text-xs text-muted-foreground">Let Emil act without asking</p></div>
            <Switch checked={form.auto_mode} onCheckedChange={(v) => setForm({ ...form, auto_mode: v })} />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-accent/10"><Shield className="w-5 h-5 text-accent" /></div>
            <h2 className="text-sm font-semibold text-foreground">Approval Gates</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">When should Emil ask permission?</Label>
            <Select value={form.approval_mode} onValueChange={(v) => setForm({ ...form, approval_mode: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto — proceed freely</SelectItem>
                <SelectItem value="ask_first">Ask First — always confirm</SelectItem>
                <SelectItem value="ask_if_money">Ask if Money — financial actions need approval</SelectItem>
                <SelectItem value="ask_if_external">Ask if External — messages/emails need approval</SelectItem>
                <SelectItem value="ask_if_destructive">Ask if Destructive — deleting/editing needs approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10"><MessageCircle className="w-5 h-5 text-emerald-400" /></div>
            <h2 className="text-sm font-semibold text-foreground">WhatsApp Rules</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">When can Emil message you?</Label>
            <Select value={form.whatsapp_rules} onValueChange={(v) => setForm({ ...form, whatsapp_rules: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent_only">Urgent Only — blockers and failures</SelectItem>
                <SelectItem value="task_complete">Task Complete — each completion</SelectItem>
                <SelectItem value="money_events">Money Events — earnings logged</SelectItem>
                <SelectItem value="daily_summary">Daily Summary — one per day</SelectItem>
                <SelectItem value="session_summary">Session Summary — end of each session</SelectItem>
                <SelectItem value="all">All — everything</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Max messages per hour</Label>
            <Input type="number" value={form.max_messages_per_hour} onChange={(e) => setForm({ ...form, max_messages_per_hour: parseInt(e.target.value) || 3 })} className="bg-secondary border-border w-24" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
            <h2 className="text-sm font-semibold text-foreground">Payout Settings</h2>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Payout Method</Label>
            <Select value={form.payout_method} onValueChange={(v) => setForm({ ...form, payout_method: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="crypto">Crypto Wallet</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Payout Details</Label>
            <Input value={form.payout_details} onChange={(e) => setForm({ ...form, payout_details: e.target.value })} placeholder="Account info, wallet address, etc." className="bg-secondary border-border" />
          </div>
        </div>

        <BridgeControlPanel health={healthRecords[0] || null} />

        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="w-full gap-2">
          <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}