'use client';

import { useState, useMemo } from 'react';
import { formatPrice, formatPricePerM2 } from '@/lib/utils';
import type { Listing } from '@/lib/types';

interface ListingsTableProps {
  listings: Listing[];
}

type SortField = 'price' | 'area' | 'price_per_m2' | 'rooms' | 'title';
type SortDir = 'asc' | 'desc';

export default function ListingsTable({ listings }: ListingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('price_per_m2');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState('');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const filtered = useMemo(() => {
    let result = [...listings];

    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(lowerFilter) ||
        l.developer?.toLowerCase().includes(lowerFilter) ||
        l.address?.toLowerCase().includes(lowerFilter)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'price': cmp = a.price - b.price; break;
        case 'area': cmp = a.area - b.area; break;
        case 'price_per_m2': cmp = a.price_per_m2 - b.price_per_m2; break;
        case 'rooms': cmp = (a.rooms ?? 0) - (b.rooms ?? 0); break;
        case 'title': cmp = a.title.localeCompare(b.title, 'pl'); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [listings, sortField, sortDir, filter]);

  if (listings.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Oferty deweloperów</h3>
        <div className="text-center py-10 text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <p className="text-sm mb-1">Brak ofert</p>
          <p className="text-xs">Kliknij &quot;Pobierz z Otodom&quot; aby pobrać aktualne oferty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="p-4 border-b border-white/[0.04] flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Oferty deweloperów ({filtered.length})
        </h3>
        <input
          type="text"
          placeholder="Szukaj..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-modern text-sm w-48 py-1.5"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('title')} className="min-w-[200px]">Tytuł {sortIcon('title')}</th>
              <th onClick={() => toggleSort('price')} className="text-right">Cena {sortIcon('price')}</th>
              <th onClick={() => toggleSort('area')} className="text-right">Pow. (m²) {sortIcon('area')}</th>
              <th onClick={() => toggleSort('price_per_m2')} className="text-right">Cena/m² {sortIcon('price_per_m2')}</th>
              <th onClick={() => toggleSort('rooms')} className="text-right">Pokoje {sortIcon('rooms')}</th>
              <th>Deweloper</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((listing) => (
              <tr key={listing.id}>
                <td>
                  <div className="max-w-[300px]">
                    <p className="text-white truncate">{listing.title}</p>
                    {listing.address && (
                      <p className="text-xs text-slate-400 truncate">{listing.address}</p>
                    )}
                  </div>
                </td>
                <td className="text-right font-medium text-white">{formatPrice(listing.price)}</td>
                <td className="text-right text-slate-300">{listing.area.toFixed(1)}</td>
                <td className="text-right">
                  <span className="font-medium text-indigo-400">{formatPricePerM2(listing.price_per_m2)}</span>
                </td>
                <td className="text-right text-slate-300">{listing.rooms ?? '—'}</td>
                <td className="text-slate-400 max-w-[150px] truncate">{listing.developer ?? '—'}</td>
                <td>
                  {listing.url && (
                    <a
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                      title="Otwórz na Otodom"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
