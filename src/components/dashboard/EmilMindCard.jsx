import React from 'react';
import { Brain } from 'lucide-react';

export default function EmilMindCard({ memory }) {
  const memMap = {};
  (memory || []).forEach(m => { memMap[m.key] = m.value; });

  const slots = [
    { key: 'current_objective', label: 'Objective' },
    { key: 'current_blocker', label: 'Blocker' },
    { key: 'last_meaningful_action', label: 'Last Action' },
    { key: 'next_planned_action', label: 'Next Step' },
    { key: 'confidence_level', label: 'Confidence' },
  ];

  const hasAny = slots.some(s => memMap[s.key]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Emil's Mind</h3>
      </div>
      {!hasAny ? (
        <p className="text-xs text-muted-foreground">Emil hasn't stored any state yet. She'll update this as she works.</p>
      ) : (
        <div className="space-y-2.5">
          {slots.map(({ key, label }) => {
            const val = memMap[key];
            if (!val) return null;
            return (
              <div key={key}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-xs text-foreground mt-0.5">{val}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}