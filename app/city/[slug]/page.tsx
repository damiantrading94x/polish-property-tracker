'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ListingsTable from '@/components/ListingsTable';
import PriceChart from '@/components/PriceChart';
import TransactionsTable from '@/components/TransactionsTable';
import AddTransactionModal from '@/components/AddTransactionModal';
import { formatPricePerM2, formatPrice, trendColor, trendIcon } from '@/lib/utils';
import type { City, Listing, Transaction, PriceSnapshot } from '@/lib/types';

interface StatsData {
  city: City;
  listings: {
    total: number;
    primary: number;
    secondary: number;
    avgPricePerM2: number;
    medianPricePerM2: number;
    minPricePerM2: number;
    maxPricePerM2: number;
    avgPrice: number;
  };
  transactions: {
    total: number;
    avgPricePerM2: number;
    medianPricePerM2: number;
    last3Months: number;
  };
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  priceHistory: PriceSnapshot[];
  lastRefreshed: string | null;
}

type Tab = 'overview' | 'listings' | 'transactions';

export default function CityPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [stats, setStats] = useState<StatsData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAddTx, setShowAddTx] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, listingsRes, txRes] = await Promise.all([
        fetch(`/api/stats/${slug}`),
        fetch(`/api/listings/${slug}`),
        fetch(`/api/transactions/${slug}`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings || []);
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching city data:', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = async (market: 'PRIMARY' | 'SECONDARY' | 'ALL' = 'PRIMARY') => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch(`/api/refresh/${slug}?market=${market}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRefreshResult(`✅ Pobrano ${data.scraped} ofert (nowe: ${data.new}, zaktualizowane: ${data.updated}, usunięte: ${data.deactivated})`);
        await fetchAll();
      } else {
        setRefreshResult(`⚠️ ${data.message || data.error || 'Nie udało się pobrać danych'}`);
      }
    } catch {
      setRefreshResult('❌ Błąd połączenia');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTransaction = async (tx: {
    transaction_date: string;
    price: number;
    area: number;
    address: string;
    property_type: string;
    market_type: string;
    notes: string;
  }) => {
    try {
      const res = await fetch(`/api/transactions/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      if (res.ok) {
        await fetchAll();
        setShowAddTx(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Nie udało się dodać transakcji');
      }
    } catch {
      alert('Błąd połączenia');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Usunąć tę transakcję?')) return;
    try {
      await fetch(`/api/transactions/${slug}?id=${id}`, { method: 'DELETE' });
      await fetchAll();
    } catch {
      alert('Błąd połączenia');
    }
  };

  const handleImportCSV = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const res = await fetch(`/api/transactions/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/csv' },
          body: text,
        });
        const data = await res.json();
        if (data.success) {
          alert(`Zaimportowano ${data.imported} transakcji${data.errors ? `\nBłędy: ${data.errors.length}` : ''}`);
          await fetchAll();
        } else {
          alert(data.error || 'Błąd importu');
        }
      } catch {
        alert('Błąd połączenia');
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie danych...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl mb-4 block">🚫</span>
        <h2 className="text-xl font-semibold text-white mb-2">Miasto nie znalezione</h2>
        <a href="/" className="text-blue-400 hover:text-blue-300">← Powrót do dashboardu</a>
      </div>
    );
  }

  const { city } = stats;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors">← Dashboard</a>
          <h2 className="text-3xl font-bold text-white mt-1">{city.name}</h2>
          <p className="text-slate-400">{city.voivodeship}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleRefresh('PRIMARY')}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Pobierz z Otodom (rynek pierwotny)
          </button>
          <button
            onClick={() => handleRefresh('ALL')}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Wszystkie oferty
          </button>
        </div>
      </div>

      {/* Refresh result banner */}
      {refreshResult && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          refreshResult.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-800' :
          refreshResult.startsWith('⚠️') ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
          'bg-red-900/30 text-red-400 border border-red-800'
        }`}>
          {refreshResult}
          <button onClick={() => setRefreshResult(null)} className="float-right text-current opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Oferty aktywne"
          value={String(stats.listings.total)}
          sub={stats.listings.avgPricePerM2 > 0 ? `śr. ${formatPricePerM2(stats.listings.avgPricePerM2)}` : undefined}
          color="blue"
        />
        <StatCard
          label="Cena/m² (oferty)"
          value={stats.listings.medianPricePerM2 > 0 ? formatPricePerM2(stats.listings.medianPricePerM2) : '—'}
          sub={stats.listings.total > 0 ? `${formatPricePerM2(stats.listings.minPricePerM2)} – ${formatPricePerM2(stats.listings.maxPricePerM2)}` : undefined}
          color="indigo"
        />
        <StatCard
          label="Transakcje (RCN)"
          value={String(stats.transactions.total)}
          sub={stats.transactions.avgPricePerM2 > 0 ? `śr. ${formatPricePerM2(stats.transactions.avgPricePerM2)}` : undefined}
          color="emerald"
        />
        <StatCard
          label="Trend cenowy"
          value={stats.trend.changePercent !== 0 ? `${trendIcon(stats.trend.direction)} ${Math.abs(stats.trend.changePercent)}%` : '→ stabilny'}
          sub={stats.trend.changePercent !== 0 ? (stats.trend.direction === 'up' ? 'Ceny rosną' : 'Ceny spadają') : 'Brak zmian'}
          color={stats.trend.direction === 'up' ? 'red' : stats.trend.direction === 'down' ? 'green' : 'slate'}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {([
          ['overview', 'Przegląd'],
          ['listings', `Oferty (${listings.length})`],
          ['transactions', `Transakcje (${transactions.length})`],
        ] as [Tab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Price Chart */}
          <PriceChart snapshots={stats.priceHistory} title={`Trend cen – ${city.name}`} />

          {/* Quick summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent listings preview */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Najnowsze oferty</h3>
                <button onClick={() => setActiveTab('listings')} className="text-sm text-blue-400 hover:text-blue-300">
                  Zobacz wszystkie →
                </button>
              </div>
              {listings.length === 0 ? (
                <p className="text-slate-400 text-sm">Brak ofert. Kliknij &quot;Pobierz z Otodom&quot; aby pobrać.</p>
              ) : (
                <div className="space-y-3">
                  {listings.slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="text-sm text-white truncate">{l.title}</p>
                        <p className="text-xs text-slate-400">{l.area} m² • {l.rooms ?? '?'} pok.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-400">{formatPricePerM2(l.price_per_m2)}</p>
                        <p className="text-xs text-slate-400">{formatPrice(l.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent transactions preview */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Ostatnie transakcje</h3>
                <button onClick={() => setActiveTab('transactions')} className="text-sm text-blue-400 hover:text-blue-300">
                  Zobacz wszystkie →
                </button>
              </div>
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-sm">Brak danych transakcyjnych. Dodaj ręcznie lub importuj CSV.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="text-sm text-white truncate">{tx.address || 'Brak adresu'}</p>
                        <p className="text-xs text-slate-400">{tx.transaction_date} • {tx.area} m² • {tx.market_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-400">{formatPricePerM2(tx.price_per_m2)}</p>
                        <p className="text-xs text-slate-400">{formatPrice(tx.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Listing vs Transaction comparison */}
          {stats.listings.avgPricePerM2 > 0 && stats.transactions.avgPricePerM2 > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Porównanie cen ofertowych i transakcyjnych</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Średnia cena ofertowa</p>
                  <p className="text-2xl font-bold text-blue-400">{formatPricePerM2(stats.listings.avgPricePerM2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Średnia cena transakcyjna</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatPricePerM2(stats.transactions.avgPricePerM2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-1">Różnica</p>
                  {(() => {
                    const diff = stats.listings.avgPricePerM2 - stats.transactions.avgPricePerM2;
                    const pct = ((diff / stats.transactions.avgPricePerM2) * 100).toFixed(1);
                    return (
                      <p className={`text-2xl font-bold ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {diff > 0 ? '+' : ''}{pct}%
                      </p>
                    );
                  })()}
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.listings.avgPricePerM2 > stats.transactions.avgPricePerM2
                      ? 'Ceny ofertowe wyższe od transakcyjnych'
                      : 'Ceny transakcyjne wyższe od ofertowych'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <ListingsTable listings={listings} />
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Transakcje z Rejestru Cen Nieruchomości</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddTx(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dodaj transakcję
              </button>
              <button
                onClick={handleImportCSV}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
              </button>
            </div>
          </div>
          <TransactionsTable
            transactions={transactions}
            onDelete={handleDeleteTransaction}
          />
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTx && (
        <AddTransactionModal
          onSubmit={handleAddTransaction}
          onClose={() => setShowAddTx(false)}
        />
      )}

      {/* Last refresh info */}
      {stats.lastRefreshed && (
        <p className="text-xs text-slate-500 text-center">
          Ostatnie odświeżenie ofert: {new Date(stats.lastRefreshed).toLocaleString('pl-PL')}
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    slate: 'border-slate-600/30 bg-slate-500/5',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.slate}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
