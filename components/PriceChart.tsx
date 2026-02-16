'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatMonth } from '@/lib/utils';
import type { PriceSnapshot } from '@/lib/types';

interface PriceChartProps {
  snapshots: PriceSnapshot[];
  title?: string;
}

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  listingAvg?: number;
  listingMedian?: number;
  transactionAvg?: number;
  transactionMedian?: number;
  listingCount?: number;
  transactionCount?: number;
}

export default function PriceChart({ snapshots, title }: PriceChartProps) {
  if (snapshots.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{title || 'Trend cenowy'}</h3>
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          Brak danych do wyświetlenia wykresu
        </div>
      </div>
    );
  }

  // Group by month and merge listing/transaction data
  const dataMap = new Map<string, ChartDataPoint>();

  for (const snap of snapshots) {
    if (!dataMap.has(snap.month)) {
      dataMap.set(snap.month, {
        month: snap.month,
        monthLabel: formatMonth(snap.month),
      });
    }
    const point = dataMap.get(snap.month)!;
    if (snap.data_type === 'listing') {
      point.listingAvg = Math.round(snap.avg_price_per_m2);
      point.listingMedian = Math.round(snap.median_price_per_m2);
      point.listingCount = snap.listing_count;
    } else {
      point.transactionAvg = Math.round(snap.avg_price_per_m2);
      point.transactionMedian = Math.round(snap.median_price_per_m2);
      point.transactionCount = snap.listing_count;
    }
  }

  const chartData = Array.from(dataMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  const hasListingData = chartData.some(d => d.listingAvg !== undefined);
  const hasTransactionData = chartData.some(d => d.transactionAvg !== undefined);

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">{title || 'Trend cenowy (zł/m²)'}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
          <XAxis
            dataKey="monthLabel"
            stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141b2d',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              color: '#f1f5f9',
              boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)',
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                transactionAvg: 'Transakcje - średnia',
                transactionMedian: 'Transakcje - mediana',
                listingAvg: 'Oferty - średnia',
                listingMedian: 'Oferty - mediana',
              };
              return [`${value.toLocaleString('pl-PL')} zł/m²`, labels[name] || name];
            }}
          />
          <Legend
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                transactionAvg: 'Transakcje - średnia',
                transactionMedian: 'Transakcje - mediana',
                listingAvg: 'Oferty - średnia',
                listingMedian: 'Oferty - mediana',
              };
              return <span className="text-xs text-slate-400">{labels[value] || value}</span>;
            }}
          />
          {hasTransactionData && (
            <>
              <Line type="monotone" dataKey="transactionAvg" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3.5 }} activeDot={{ r: 5.5, stroke: '#10b981', strokeWidth: 2, fill: '#141b2d' }} connectNulls />
              <Line type="monotone" dataKey="transactionMedian" stroke="#6ee7b7" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: '#6ee7b7', r: 2.5 }} connectNulls />
            </>
          )}
          {hasListingData && (
            <>
              <Line type="monotone" dataKey="listingAvg" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3.5 }} activeDot={{ r: 5.5, stroke: '#6366f1', strokeWidth: 2, fill: '#141b2d' }} connectNulls />
              <Line type="monotone" dataKey="listingMedian" stroke="#a5b4fc" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: '#a5b4fc', r: 2.5 }} connectNulls />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
