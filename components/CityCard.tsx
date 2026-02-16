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
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 transition-all duration-200 animate-fadeIn">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link href={`/city/${city.slug}`} className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
            {city.name}
          </Link>
          <p className="text-sm text-slate-400 mt-1">{city.voivodeship}</p>
        </div>
        <div className="flex items-center gap-2">
          {trend.changePercent !== 0 && (
            <span className={`text-sm font-medium ${trendColor(trend.direction)} flex items-center gap-1`}>
              <span className="text-lg">{trendIcon(trend.direction)}</span>
              {Math.abs(trend.changePercent)}%
            </span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); onRemove(city.slug); }}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Usuń miasto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Oferty deweloperów</p>
          <p className="text-2xl font-bold text-white">{listingCount}</p>
          {avgPricePerM2 > 0 && (
            <p className="text-sm text-blue-400 mt-1">{formatPricePerM2(avgPricePerM2)}</p>
          )}
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Transakcje (RCN)</p>
          <p className="text-2xl font-bold text-white">{transactionCount}</p>
          {avgTransactionPricePerM2 > 0 && (
            <p className="text-sm text-emerald-400 mt-1">{formatPricePerM2(avgTransactionPricePerM2)}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/city/${city.slug}`}
          className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Zobacz szczegóły →
        </Link>
        {data.lastRefreshed && (
          <span className="text-xs text-slate-500">
            Odświeżono: {new Date(data.lastRefreshed).toLocaleDateString('pl-PL')}
          </span>
        )}
      </div>
    </div>
  );
}
