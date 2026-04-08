import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function EarningsChart({ earnings }) {
  // Build last 14 days of data
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayEarnings = (earnings || []).filter(e => {
      const eDate = format(new Date(e.created_date), 'yyyy-MM-dd');
      return eDate === dayStr;
    });
    const total = dayEarnings.reduce((sum, e) => sum + (e.amount || 0), 0);
    return { date: format(date, 'MMM d'), amount: total };
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Earnings (14 days)</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 60%, 70%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 60%, 70%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(222, 44%, 8%)',
                border: '1px solid hsl(222, 30%, 16%)',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'hsl(210, 40%, 96%)',
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Earnings']}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(220, 60%, 70%)"
              strokeWidth={2}
              fill="url(#earningsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}