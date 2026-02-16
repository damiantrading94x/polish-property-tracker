'use client';

import { useState, useMemo } from 'react';
import { formatPrice, formatPricePerM2, formatDate } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

type SortField = 'transaction_date' | 'price' | 'area' | 'price_per_m2' | 'address';
type SortDir = 'asc' | 'desc';

export default function TransactionsTable({ transactions, onDelete }: TransactionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('transaction_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState<string>('all');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'transaction_date' ? 'desc' : 'asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(tx =>
        tx.address?.toLowerCase().includes(lowerFilter) ||
        tx.notes?.toLowerCase().includes(lowerFilter) ||
        tx.market_type?.toLowerCase().includes(lowerFilter)
      );
    }

    if (marketFilter !== 'all') {
      result = result.filter(tx => tx.market_type === marketFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'transaction_date': cmp = a.transaction_date.localeCompare(b.transaction_date); break;
        case 'price': cmp = a.price - b.price; break;
        case 'area': cmp = a.area - b.area; break;
        case 'price_per_m2': cmp = a.price_per_m2 - b.price_per_m2; break;
        case 'address': cmp = (a.address || '').localeCompare(b.address || '', 'pl'); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, sortField, sortDir, filter, marketFilter]);

  // Calculate statistics
  const avgPricePerM2 = filtered.length > 0
    ? Math.round(filtered.reduce((sum, tx) => sum + tx.price_per_m2, 0) / filtered.length)
    : 0;

  const medianPricePerM2 = (() => {
    if (filtered.length === 0) return 0;
    const sorted = [...filtered].sort((a, b) => a.price_per_m2 - b.price_per_m2);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1].price_per_m2 + sorted[mid].price_per_m2) / 2)
      : Math.round(sorted[mid].price_per_m2);
  })();

  if (transactions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="text-center py-8 text-slate-400">
          <span className="text-4xl mb-3 block">📋</span>
          <p className="text-lg mb-2">Brak danych transakcyjnych</p>
          <p className="text-sm">Dodaj transakcje ręcznie lub zaimportuj z pliku CSV.</p>
          <p className="text-xs mt-4 text-slate-500">
            Format CSV: data, cena, powierzchnia, adres, typ_rynku, typ_nieruchomosci, uwagi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {filtered.length} transakcji
            </span>
            {avgPricePerM2 > 0 && (
              <>
                <span className="text-sm text-slate-500">|</span>
                <span className="text-sm text-emerald-400">
                  śr. {formatPricePerM2(avgPricePerM2)}
                </span>
                <span className="text-sm text-slate-500">|</span>
                <span className="text-sm text-emerald-400/70">
                  med. {formatPricePerM2(medianPricePerM2)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Wszystkie rynki</option>
              <option value="pierwotny">Rynek pierwotny</option>
              <option value="wtórny">Rynek wtórny</option>
            </select>
            <input
              type="text"
              placeholder="Szukaj..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('transaction_date')}>Data {sortIcon('transaction_date')}</th>
              <th onClick={() => toggleSort('address')} className="min-w-[200px]">Adres {sortIcon('address')}</th>
              <th onClick={() => toggleSort('price')} className="text-right">Cena {sortIcon('price')}</th>
              <th onClick={() => toggleSort('area')} className="text-right">Pow. (m²) {sortIcon('area')}</th>
              <th onClick={() => toggleSort('price_per_m2')} className="text-right">Cena/m² {sortIcon('price_per_m2')}</th>
              <th>Rynek</th>
              <th>Źródło</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td className="text-slate-300 whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
                <td>
                  <div className="max-w-[250px]">
                    <p className="text-white truncate">{tx.address || '—'}</p>
                    {tx.notes && <p className="text-xs text-slate-500 truncate">{tx.notes}</p>}
                  </div>
                </td>
                <td className="text-right font-medium text-white">{formatPrice(tx.price)}</td>
                <td className="text-right text-slate-300">{tx.area.toFixed(1)}</td>
                <td className="text-right">
                  <span className="font-medium text-emerald-400">{formatPricePerM2(tx.price_per_m2)}</span>
                </td>
                <td>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    tx.market_type === 'pierwotny'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {tx.market_type}
                  </span>
                </td>
                <td className="text-xs text-slate-500">{tx.source}</td>
                <td>
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Usuń transakcję"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
