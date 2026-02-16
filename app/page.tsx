'use client';

import { useState, useEffect, useCallback } from 'react';
import CityCard from '@/components/CityCard';
import type { City, CityCardData } from '@/lib/types';

// Known Polish cities with their Otodom slugs
// otodom_city_slug = full path after voivodeship: county/municipality/city
const POLISH_CITIES = [
  { name: 'Ełk', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'elcki/gmina-miejska--elk/elk' },
  { name: 'Suwałki', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'suwalki/suwalki/suwalki' },
  { name: 'Warszawa', voivodeship: 'mazowieckie', voivodeship_slug: 'mazowieckie', otodom_city_slug: 'warszawa/warszawa/warszawa' },
  { name: 'Kraków', voivodeship: 'małopolskie', voivodeship_slug: 'malopolskie', otodom_city_slug: 'krakow/krakow/krakow' },
  { name: 'Wrocław', voivodeship: 'dolnośląskie', voivodeship_slug: 'dolnoslaskie', otodom_city_slug: 'wroclaw/wroclaw/wroclaw' },
  { name: 'Poznań', voivodeship: 'wielkopolskie', voivodeship_slug: 'wielkopolskie', otodom_city_slug: 'poznan/poznan/poznan' },
  { name: 'Gdańsk', voivodeship: 'pomorskie', voivodeship_slug: 'pomorskie', otodom_city_slug: 'gdansk/gdansk/gdansk' },
  { name: 'Łódź', voivodeship: 'łódzkie', voivodeship_slug: 'lodzkie', otodom_city_slug: 'lodz/lodz/lodz' },
  { name: 'Katowice', voivodeship: 'śląskie', voivodeship_slug: 'slaskie', otodom_city_slug: 'katowice/katowice/katowice' },
  { name: 'Lublin', voivodeship: 'lubelskie', voivodeship_slug: 'lubelskie', otodom_city_slug: 'lublin/lublin/lublin' },
  { name: 'Białystok', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'bialystok/bialystok/bialystok' },
  { name: 'Olsztyn', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'olsztyn/olsztyn/olsztyn' },
  { name: 'Rzeszów', voivodeship: 'podkarpackie', voivodeship_slug: 'podkarpackie', otodom_city_slug: 'rzeszow/rzeszow/rzeszow' },
  { name: 'Szczecin', voivodeship: 'zachodniopomorskie', voivodeship_slug: 'zachodniopomorskie', otodom_city_slug: 'szczecin/szczecin/szczecin' },
  { name: 'Bydgoszcz', voivodeship: 'kujawsko-pomorskie', voivodeship_slug: 'kujawsko--pomorskie', otodom_city_slug: 'bydgoszcz/bydgoszcz/bydgoszcz' },
  { name: 'Toruń', voivodeship: 'kujawsko-pomorskie', voivodeship_slug: 'kujawsko--pomorskie', otodom_city_slug: 'torun/torun/torun' },
  { name: 'Kielce', voivodeship: 'świętokrzyskie', voivodeship_slug: 'swietokrzyskie', otodom_city_slug: 'kielce/kielce/kielce' },
  { name: 'Opole', voivodeship: 'opolskie', voivodeship_slug: 'opolskie', otodom_city_slug: 'opole/opole/opole' },
  { name: 'Zielona Góra', voivodeship: 'lubuskie', voivodeship_slug: 'lubuskie', otodom_city_slug: 'zielona-gora/zielona-gora/zielona-gora' },
  { name: 'Gorzów Wielkopolski', voivodeship: 'lubuskie', voivodeship_slug: 'lubuskie', otodom_city_slug: 'gorzow-wielkopolski/gorzow-wielkopolski/gorzow-wielkopolski' },
  { name: 'Augustów', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'augustowski/augustow/augustow' },
  { name: 'Giżycko', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'gizycki/gmina-miejska--gizycko/gizycko' },
];

export default function HomePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityStats, setCityStats] = useState<Record<string, CityCardData>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [customCity, setCustomCity] = useState({ name: '', voivodeship: '', voivodeship_slug: '', otodom_city_slug: '' });
  const [showCustomForm, setShowCustomForm] = useState(false);

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch('/api/cities');
      const data = await res.json();
      setCities(data.cities || []);
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    }
  }, []);

  const fetchStats = useCallback(async (cityList: City[]) => {
    const stats: Record<string, CityCardData> = {};
    await Promise.all(
      cityList.map(async (city) => {
        try {
          const res = await fetch(`/api/stats/${city.slug}`);
          const data = await res.json();
          stats[city.slug] = {
            city,
            listingCount: data.listings?.total || 0,
            avgPricePerM2: data.listings?.avgPricePerM2 || 0,
            transactionCount: data.transactions?.total || 0,
            avgTransactionPricePerM2: data.transactions?.avgPricePerM2 || 0,
            trend: data.trend || { direction: 'stable', changePercent: 0 },
            lastRefreshed: data.lastRefreshed || null,
          };
        } catch (err) {
          console.error(`Failed to fetch stats for ${city.name}:`, err);
        }
      })
    );
    setCityStats(stats);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCities();
      setLoading(false);
    };
    init();
  }, [fetchCities]);

  useEffect(() => {
    if (cities.length > 0) {
      fetchStats(cities);
    }
  }, [cities, fetchStats]);

  const handleAddCity = async (cityData: typeof POLISH_CITIES[0]) => {
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cityData),
      });
      if (res.ok) {
        await fetchCities();
        setShowAddModal(false);
        setAddSearch('');
      } else {
        const err = await res.json();
        alert(err.error || 'Nie udało się dodać miasta');
      }
    } catch {
      alert('Błąd połączenia');
    }
  };

  const handleAddCustomCity = async () => {
    if (!customCity.name || !customCity.voivodeship || !customCity.voivodeship_slug || !customCity.otodom_city_slug) {
      alert('Wypełnij wszystkie pola');
      return;
    }
    await handleAddCity(customCity);
    setCustomCity({ name: '', voivodeship: '', voivodeship_slug: '', otodom_city_slug: '' });
    setShowCustomForm(false);
  };

  const handleRemoveCity = async (slug: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to miasto? Wszystkie dane zostaną utracone.')) return;
    try {
      await fetch(`/api/cities?slug=${slug}`, { method: 'DELETE' });
      await fetchCities();
    } catch {
      alert('Nie udało się usunąć miasta');
    }
  };

  const filteredCities = POLISH_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(addSearch.toLowerCase()) &&
      !cities.some((existing) => existing.otodom_city_slug === c.otodom_city_slug)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Śledzone miasta</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Monitoruj ceny mieszkań i transakcje w wybranych miastach
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj miasto
        </button>
      </div>

      {/* City Cards Grid */}
      {cities.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Brak śledzonych miast</h3>
          <p className="text-slate-500 mb-6 text-sm">
            Dodaj miasta, których ceny mieszkań chcesz śledzić
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            Dodaj pierwsze miasto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities.map((city) => (
            <CityCard
              key={city.slug}
              data={cityStats[city.slug] || {
                city,
                listingCount: 0,
                avgPricePerM2: 0,
                transactionCount: 0,
                avgTransactionPricePerM2: 0,
                trend: { direction: 'stable', changePercent: 0 },
                lastRefreshed: null,
              }}
              onRemove={handleRemoveCity}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Jak to działa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <p className="font-medium text-slate-300 mb-1">Oferty deweloperów</p>
              <p className="text-slate-500 text-xs leading-relaxed">Pobieraj aktualne oferty mieszkań z Otodom. Śledź ceny za m² i zmiany cen.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="font-medium text-slate-300 mb-1">Ceny transakcyjne</p>
              <p className="text-slate-500 text-xs leading-relaxed">Dodawaj dane z Rejestru Cen Nieruchomości (RCN). Ceny faktycznych transakcji.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </div>
            <div>
              <p className="font-medium text-slate-300 mb-1">Trendy cenowe</p>
              <p className="text-slate-500 text-xs leading-relaxed">Wykresy zmian cen w czasie. Porównuj ceny ofertowe z transakcyjnymi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Dodaj miasto</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.05]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Szukaj miasta..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="input-modern mb-4"
              autoFocus
            />

            {/* City list */}
            <div className="max-h-64 overflow-y-auto space-y-0.5 mb-4">
              {filteredCities.length === 0 && !showCustomForm ? (
                <p className="text-slate-500 text-sm py-6 text-center">
                  {addSearch ? 'Nie znaleziono miasta. Dodaj ręcznie poniżej.' : 'Wszystkie predefiniowane miasta są już dodane.'}
                </p>
              ) : (
                filteredCities.map((city) => (
                  <button
                    key={city.otodom_city_slug}
                    onClick={() => handleAddCity(city)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors text-left group/item"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">{city.name}</p>
                      <p className="text-xs text-slate-500">{city.voivodeship}</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-600 group-hover/item:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))
              )}
            </div>

            {/* Custom city form */}
            <div className="border-t border-white/[0.04] pt-4">
              {!showCustomForm ? (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  + Dodaj inne miasto ręcznie
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Wpisz dane miasta. Ścieżkę Otodom znajdziesz w URL na otodom.pl (np. elcki/gmina-miejska--elk/elk)
                  </p>
                  <input
                    type="text"
                    placeholder="Nazwa miasta (np. Augustów)"
                    value={customCity.name}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, name: e.target.value }))}
                    className="input-modern text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Województwo (np. podlaskie)"
                    value={customCity.voivodeship}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, voivodeship: e.target.value }))}
                    className="input-modern text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Slug województwa w URL (np. podlaskie)"
                    value={customCity.voivodeship_slug}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, voivodeship_slug: e.target.value }))}
                    className="input-modern text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ścieżka w URL Otodom (np. elcki/gmina-miejska--elk/elk)"
                    value={customCity.otodom_city_slug}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, otodom_city_slug: e.target.value }))}
                    className="input-modern text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomCity}
                      className="flex-1 btn-primary justify-center px-4 py-2 text-sm"
                    >
                      Dodaj
                    </button>
                    <button
                      onClick={() => setShowCustomForm(false)}
                      className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-white transition-colors"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
