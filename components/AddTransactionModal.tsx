'use client';

import { useState } from 'react';

interface AddTransactionModalProps {
  onSubmit: (tx: {
    transaction_date: string;
    price: number;
    area: number;
    address: string;
    property_type: string;
    market_type: string;
    notes: string;
  }) => void;
  onClose: () => void;
}

export default function AddTransactionModal({ onSubmit, onClose }: AddTransactionModalProps) {
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    price: '',
    area: '',
    address: '',
    property_type: 'mieszkanie',
    market_type: 'pierwotny',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    const area = parseFloat(form.area);
    if (!price || !area || !form.transaction_date) {
      alert('Wypełnij wymagane pola: data, cena, powierzchnia');
      return;
    }
    onSubmit({
      transaction_date: form.transaction_date,
      price,
      area,
      address: form.address,
      property_type: form.property_type,
      market_type: form.market_type,
      notes: form.notes,
    });
  };

  const pricePerM2 = (() => {
    const price = parseFloat(form.price);
    const area = parseFloat(form.area);
    if (price > 0 && area > 0) {
      return Math.round(price / area);
    }
    return null;
  })();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Dodaj transakcję</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data transakcji *</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm(prev => ({ ...prev, transaction_date: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Typ rynku</label>
              <select
                value={form.market_type}
                onChange={(e) => setForm(prev => ({ ...prev, market_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="pierwotny">Rynek pierwotny</option>
                <option value="wtórny">Rynek wtórny</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Cena (PLN) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="np. 350000"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
                min="0"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Powierzchnia (m²) *</label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))}
                placeholder="np. 55.5"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {pricePerM2 && (
            <div className="bg-slate-900/50 rounded-lg px-4 py-2 text-center">
              <span className="text-sm text-slate-400">Cena za m²: </span>
              <span className="text-lg font-bold text-emerald-400">
                {pricePerM2.toLocaleString('pl-PL')} zł/m²
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">Adres</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="np. ul. Wojska Polskiego 12/4"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Typ nieruchomości</label>
              <select
                value={form.property_type}
                onChange={(e) => setForm(prev => ({ ...prev, property_type: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="mieszkanie">Mieszkanie</option>
                <option value="dom">Dom</option>
                <option value="działka">Działka</option>
                <option value="lokal">Lokal użytkowy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Uwagi</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="np. 2 pokoje, 3 piętro"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              Dodaj transakcję
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
