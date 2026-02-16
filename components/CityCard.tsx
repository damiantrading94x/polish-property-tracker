'use client';

import Link from 'next/link';
import { formatPricePerM2, trendColor, trendIcon } from '@/lib/utils';
import type { CityCardData } from '@/lib/types';

interface CityCardProps {
  data: CityCardData;
  onRemove: (slug: string) => void;
}

export default function CityCard({ data, onRemove }: CityCardProps) {
  const { city, listingCount, avgPricePerM2, transactionCount, avgTransactionPricePerM2, trend } = data;

  return (
    <div className="glass-card p-6 group hover:border-indigo-500/20 transition-all duration-300 animate-fadeIn">
      <div className="flex items-start justify-between mb-5">
        <div>
          <Link href={`/city/${city.slug}`} className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
            {city.name}
          </Link>
          <p className="text-sm text-slate-500 mt-0.5">{city.voivodeship}</p>
        </div>
        <div className="flex items-center gap-2">
          {trend.changePercent !== 0 && (
            <span className={`text-sm font-medium ${trendColor(trend.direction)} flex items-center gap-1 bg-white/[0.04] px-2.5 py-1 rounded-lg`}>
              <span className="text-base">{trendIcon(trend.direction)}</span>
              {Math.abs(trend.changePercent)}%
            </span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); onRemove(city.slug); }}
            className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
            title="Usuń miasto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04]">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Oferty</p>
          <p className="text-2xl font-bold text-white">{listingCount}</p>
          {avgPricePerM2 > 0 && (
            <p className="text-sm text-indigo-400 mt-1 font-medium">{formatPricePerM2(avgPricePerM2)}</p>
          )}
        </div>
        <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04]">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">Transakcje</p>
          <p className="text-2xl font-bold text-white">{transactionCount}</p>
          {avgTransactionPricePerM2 > 0 && (
            <p className="text-sm text-emerald-400 mt-1 font-medium">{formatPricePerM2(avgTransactionPricePerM2)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/city/${city.slug}`}
          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1.5"
        >
          Zobacz szczegóły
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
        {data.lastRefreshed && (
          <span className="text-[11px] text-slate-600">
            {new Date(data.lastRefreshed).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>
    </div>
  );
}
