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
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title || 'Trend cenowy'}</h3>
        <div className="flex items-center justify-center h-48 text-slate-400">
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
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title || 'Trend cenowy (zł/m²)'}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="monthLabel"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
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
              return <span className="text-sm">{labels[value] || value}</span>;
            }}
          />
          {hasTransactionData && (
            <>
              <Line type="monotone" dataKey="transactionAvg" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} connectNulls />
              <Line type="monotone" dataKey="transactionMedian" stroke="#86efac" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: '#86efac', r: 3 }} connectNulls />
            </>
          )}
          {hasListingData && (
            <>
              <Line type="monotone" dataKey="listingAvg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} connectNulls />
              <Line type="monotone" dataKey="listingMedian" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: '#93c5fd', r: 3 }} connectNulls />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
