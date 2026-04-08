import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import StatCard from '../components/dashboard/StatCard';
import EarningsChart from '../components/dashboard/EarningsChart';

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  collected: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid_out: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  disputed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const confidenceColors = {
  confirmed: 'text-emerald-400',
  likely: 'text-amber-400',
  speculative: 'text-red-400',
};

export default function Earnings() {
  const { data: earnings = [] } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => base44.entities.Earning.list('-created_date', 100),
  });

  const total = earnings.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = earnings.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount || 0), 0);
  const collected = earnings.filter(e => e.status === 'collected' || e.status === 'paid_out').reduce((s, e) => s + (e.amount || 0), 0);
  const confirmed = earnings.filter(e => e.confidence === 'confirmed').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue tracking with attribution and confidence</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={`$${total.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Pending" value={`$${pending.toFixed(2)}`} icon={Clock} />
        <StatCard title="Collected" value={`$${collected.toFixed(2)}`} icon={CheckCircle2} />
        <StatCard title="Confirmed Real" value={`$${confirmed.toFixed(2)}`} icon={TrendingUp} subtitle="High confidence only" />
      </div>

      <EarningsChart earnings={earnings} />

      <div className="mt-6 bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Transaction History</h3>
        </div>
        {earnings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No earnings yet. Emil will log revenue as she generates income.</div>
        ) : (
          <div className="divide-y divide-border">
            {earnings.map((e) => (
              <div key={e.id} className="px-5 py-3 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{e.source}</p>
                    {e.client && <span className="text-[10px] text-muted-foreground">· {e.client}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {e.category?.replace('_', ' ')} · {format(new Date(e.created_date), 'MMM d, yyyy')}
                    {e.expected_amount && e.expected_amount !== e.amount && <span className="ml-1">(expected ${e.expected_amount})</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e.confidence && (
                    <span className={cn('text-[10px] font-medium', confidenceColors[e.confidence] || 'text-muted-foreground')}>{e.confidence}</span>
                  )}
                  <Badge variant="secondary" className={cn('text-[10px] border', statusColors[e.status] || statusColors.pending)}>{e.status?.replace('_', ' ')}</Badge>
                  <span className="text-sm font-semibold text-emerald-400">${e.amount?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}