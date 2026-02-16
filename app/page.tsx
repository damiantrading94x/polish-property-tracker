'use client';

import { useState, useEffect, useCallback } from 'react';
import CityCard from '@/components/CityCard';
import type { City, CityCardData } from '@/lib/types';

// Known Polish cities with their Otodom slugs
const POLISH_CITIES = [
  { name: 'Ełk', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'elk' },
  { name: 'Suwałki', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'suwalki' },
  { name: 'Warszawa', voivodeship: 'mazowieckie', voivodeship_slug: 'mazowieckie', otodom_city_slug: 'warszawa' },
  { name: 'Kraków', voivodeship: 'małopolskie', voivodeship_slug: 'malopolskie', otodom_city_slug: 'krakow' },
  { name: 'Wrocław', voivodeship: 'dolnośląskie', voivodeship_slug: 'dolnoslaskie', otodom_city_slug: 'wroclaw' },
  { name: 'Poznań', voivodeship: 'wielkopolskie', voivodeship_slug: 'wielkopolskie', otodom_city_slug: 'poznan' },
  { name: 'Gdańsk', voivodeship: 'pomorskie', voivodeship_slug: 'pomorskie', otodom_city_slug: 'gdansk' },
  { name: 'Łódź', voivodeship: 'łódzkie', voivodeship_slug: 'lodzkie', otodom_city_slug: 'lodz' },
  { name: 'Katowice', voivodeship: 'śląskie', voivodeship_slug: 'slaskie', otodom_city_slug: 'katowice' },
  { name: 'Lublin', voivodeship: 'lubelskie', voivodeship_slug: 'lubelskie', otodom_city_slug: 'lublin' },
  { name: 'Białystok', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'bialystok' },
  { name: 'Olsztyn', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'olsztyn' },
  { name: 'Rzeszów', voivodeship: 'podkarpackie', voivodeship_slug: 'podkarpackie', otodom_city_slug: 'rzeszow' },
  { name: 'Szczecin', voivodeship: 'zachodniopomorskie', voivodeship_slug: 'zachodniopomorskie', otodom_city_slug: 'szczecin' },
  { name: 'Bydgoszcz', voivodeship: 'kujawsko-pomorskie', voivodeship_slug: 'kujawsko--pomorskie', otodom_city_slug: 'bydgoszcz' },
  { name: 'Toruń', voivodeship: 'kujawsko-pomorskie', voivodeship_slug: 'kujawsko--pomorskie', otodom_city_slug: 'torun' },
  { name: 'Kielce', voivodeship: 'świętokrzyskie', voivodeship_slug: 'swietokrzyskie', otodom_city_slug: 'kielce' },
  { name: 'Opole', voivodeship: 'opolskie', voivodeship_slug: 'opolskie', otodom_city_slug: 'opole' },
  { name: 'Zielona Góra', voivodeship: 'lubuskie', voivodeship_slug: 'lubuskie', otodom_city_slug: 'zielona-gora' },
  { name: 'Gorzów Wielkopolski', voivodeship: 'lubuskie', voivodeship_slug: 'lubuskie', otodom_city_slug: 'gorzow-wielkopolski' },
  { name: 'Augustów', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'augustow' },
  { name: 'Giżycko', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'gizycko' },
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
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-slate-400">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Śledzone miasta</h2>
          <p className="text-slate-400 mt-1">
            Monitoruj ceny mieszkań i transakcje w wybranych miastach
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj miasto
        </button>
      </div>

      {/* City Cards Grid */}
      {cities.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <span className="text-5xl mb-4 block">🏙️</span>
          <h3 className="text-xl font-semibold text-white mb-2">Brak śledzonych miast</h3>
          <p className="text-slate-400 mb-6">
            Dodaj miasta, których ceny mieszkań chcesz śledzić
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Dodaj pierwsze miasto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>ℹ️</span> Jak to działa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-400">
          <div>
            <p className="font-medium text-slate-300 mb-1">📊 Oferty deweloperów</p>
            <p>Pobieraj aktualne oferty mieszkań z Otodom. Śledź ceny za m², liczbę ofert i zmiany cen.</p>
          </div>
          <div>
            <p className="font-medium text-slate-300 mb-1">💰 Ceny transakcyjne</p>
            <p>Dodawaj dane z Rejestru Cen Nieruchomości (RCN). Zobacz za ile faktycznie sprzedano mieszkania.</p>
          </div>
          <div>
            <p className="font-medium text-slate-300 mb-1">📈 Trendy cenowe</p>
            <p>Wykresy zmian cen w czasie. Porównuj ceny ofertowe z transakcyjnymi.</p>
          </div>
        </div>
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Dodaj miasto</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
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
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />

            {/* City list */}
            <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
              {filteredCities.length === 0 && !showCustomForm ? (
                <p className="text-slate-400 text-sm py-4 text-center">
                  {addSearch ? 'Nie znaleziono miasta. Dodaj ręcznie poniżej.' : 'Wszystkie predefiniowane miasta są już dodane.'}
                </p>
              ) : (
                filteredCities.map((city) => (
                  <button
                    key={city.otodom_city_slug}
                    onClick={() => handleAddCity(city)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors text-left"
                  >
                    <div>
                      <p className="text-white font-medium">{city.name}</p>
                      <p className="text-xs text-slate-400">{city.voivodeship}</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))
              )}
            </div>

            {/* Custom city form */}
            <div className="border-t border-slate-700 pt-4">
              {!showCustomForm ? (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  + Dodaj inne miasto ręcznie
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">
                    Wpisz dane miasta (slug Otodom znajdziesz w URL na otodom.pl)
                  </p>
                  <input
                    type="text"
                    placeholder="Nazwa miasta (np. Augustów)"
                    value={customCity.name}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Województwo (np. podlaskie)"
                    value={customCity.voivodeship}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, voivodeship: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Slug województwa w URL (np. podlaskie)"
                    value={customCity.voivodeship_slug}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, voivodeship_slug: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Slug miasta w URL Otodom (np. augustow)"
                    value={customCity.otodom_city_slug}
                    onChange={(e) => setCustomCity(prev => ({ ...prev, otodom_city_slug: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustomCity}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Dodaj
                    </button>
                    <button
                      onClick={() => setShowCustomForm(false)}
                      className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
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
