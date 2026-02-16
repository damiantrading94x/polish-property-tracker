import path from 'path';
import fs from 'fs';
import type { City, CityInput, Listing, ListingInput, Transaction, TransactionInput, PriceSnapshot } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// ===== JSON File Storage =====

interface DbData {
  cities: City[];
  listings: Listing[];
  listing_price_history: { id: number; listing_id: number; price: number; price_per_m2: number; recorded_at: string; created_at: string }[];
  transactions: Transaction[];
  price_snapshots: PriceSnapshot[];
  refresh_log: { id: number; city_id: number; refreshed_at: string; listings_found: number; status: string; error_message: string | null }[];
  _nextId: { cities: number; listings: number; listing_price_history: number; transactions: number; price_snapshots: number; refresh_log: number };
}

function defaultDb(): DbData {
  return {
    cities: [],
    listings: [],
    listing_price_history: [],
    transactions: [],
    price_snapshots: [],
    refresh_log: [],
    _nextId: { cities: 1, listings: 1, listing_price_history: 1, transactions: 1, price_snapshots: 1, refresh_log: 1 },
  };
}

let _db: DbData | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb(): DbData {
  if (_db) return _db;
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      _db = JSON.parse(raw) as DbData;
      // Ensure all arrays exist (backwards compat)
      const def = defaultDb();
      for (const key of Object.keys(def) as (keyof DbData)[]) {
        if (!((_db as unknown) as Record<string, unknown>)[key]) {
          ((_db as unknown) as Record<string, unknown>)[key] = def[key];
        }
      }
      return _db;
    } catch {
      _db = defaultDb();
    }
  } else {
    _db = defaultDb();
    seedDefaultData(_db);
    saveDb(_db);
  }
  return _db;
}

function saveDb(db: DbData) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function nextId(db: DbData, table: keyof DbData['_nextId']): number {
  const id = db._nextId[table];
  db._nextId[table] = id + 1;
  return id;
}

function nowStr(): string {
  return new Date().toISOString();
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ===== Seed Data =====

function seedDefaultData(db: DbData) {
  const defaultCities: CityInput[] = [
    { name: 'Ełk', slug: 'elk', voivodeship: 'warmińsko-mazurskie', voivodeship_slug: 'warminsko--mazurskie', otodom_city_slug: 'elk' },
    { name: 'Suwałki', slug: 'suwalki', voivodeship: 'podlaskie', voivodeship_slug: 'podlaskie', otodom_city_slug: 'suwalki' },
  ];

  for (const c of defaultCities) {
    const id = nextId(db, 'cities');
    db.cities.push({
      id, name: c.name, slug: c.slug, voivodeship: c.voivodeship,
      voivodeship_slug: c.voivodeship_slug, otodom_city_slug: c.otodom_city_slug,
      created_at: nowStr(),
    });
  }

  const elkId = db.cities.find(c => c.slug === 'elk')!.id;
  const suwalkiId = db.cities.find(c => c.slug === 'suwalki')!.id;

  const elkTxs: [string, number, number, number, string, string, string, string, string][] = [
    ['2025-08-15', 302500, 55.0, 5500, 'ul. Wojska Polskiego 12', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, parter'],
    ['2025-09-03', 378000, 63.0, 6000, 'ul. Gdańska 8/4', 'mieszkanie', 'pierwotny', 'RCN', '3 pokoje, 2 piętro'],
    ['2025-09-22', 264000, 44.0, 6000, 'ul. Armii Krajowej 15', 'mieszkanie', 'wtórny', 'RCN', '2 pokoje, 3 piętro'],
    ['2025-10-10', 336000, 56.0, 6000, 'ul. Mickiewicza 3/12', 'mieszkanie', 'pierwotny', 'RCN', '3 pokoje, 1 piętro'],
    ['2025-10-28', 325000, 50.0, 6500, 'ul. Piłsudskiego 7', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, 4 piętro'],
    ['2025-11-05', 195000, 30.0, 6500, 'ul. Kilińskiego 22', 'mieszkanie', 'wtórny', 'RCN', 'kawalerka, 2 piętro'],
    ['2025-11-18', 429000, 66.0, 6500, 'ul. Grunwaldzka 44', 'mieszkanie', 'pierwotny', 'RCN', '3 pokoje, 3 piętro'],
    ['2025-12-02', 287000, 41.0, 7000, 'os. Północ II 5/8', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, nowsze budownictwo'],
    ['2025-12-20', 462000, 66.0, 7000, 'ul. Słowackiego 9', 'mieszkanie', 'pierwotny', 'RCN', '3 pokoje, 2 piętro'],
    ['2026-01-08', 350000, 50.0, 7000, 'ul. Wojska Polskiego 30', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, 1 piętro, nowe'],
    ['2026-01-22', 245000, 35.0, 7000, 'ul. Dąbrowskiego 14', 'mieszkanie', 'wtórny', 'RCN', 'kawalerka z aneksem kuchennym'],
  ];

  const suwalkiTxs: [string, number, number, number, string, string, string, string, string][] = [
    ['2025-08-10', 348000, 60.0, 5800, 'ul. Noniewicza 15', 'mieszkanie', 'wtórny', 'RCN', '3 pokoje, parter'],
    ['2025-09-05', 305000, 50.0, 6100, 'ul. Kościuszki 22', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, 3 piętro'],
    ['2025-09-25', 390000, 60.0, 6500, 'ul. Utrata 8/3', 'mieszkanie', 'pierwotny', 'RCN', '3 pokoje, 1 piętro'],
    ['2025-10-15', 273000, 42.0, 6500, 'ul. Hamerszmita 12', 'mieszkanie', 'wtórny', 'RCN', '2 pokoje, 4 piętro'],
    ['2025-10-30', 455000, 70.0, 6500, 'ul. Sejneńska 3', 'mieszkanie', 'pierwotny', 'RCN', '4 pokoje, 2 piętro'],
    ['2025-11-12', 208000, 32.0, 6500, 'os. II 14/2', 'mieszkanie', 'wtórny', 'RCN', 'kawalerka'],
    ['2025-11-28', 406000, 58.0, 7000, 'ul. Bakałarzewska 67', 'mieszkanie', 'pierwotny', 'RCN', '3 pokoje, nowe osiedle'],
    ['2025-12-10', 336000, 48.0, 7000, 'ul. Filipowska 20', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, 4 piętro'],
    ['2025-12-22', 227500, 35.0, 6500, 'ul. Pułaskiego 5', 'mieszkanie', 'wtórny', 'RCN', '1 pokój z aneksem'],
    ['2026-01-10', 525000, 70.0, 7500, 'ul. Noniewicza 40', 'mieszkanie', 'pierwotny', 'RCN', '4 pokoje, premium'],
    ['2026-01-25', 375000, 50.0, 7500, 'ul. Wigierska 18', 'mieszkanie', 'pierwotny', 'RCN', '2 pokoje, nowe, wykończone'],
  ];

  for (const [date, price, area, ppm2, addr, ptype, mtype, source, notes] of elkTxs) {
    db.transactions.push({
      id: nextId(db, 'transactions'), city_id: elkId, transaction_date: date,
      price, area, price_per_m2: ppm2, address: addr, property_type: ptype,
      market_type: mtype, source, notes, created_at: nowStr(),
    });
  }
  for (const [date, price, area, ppm2, addr, ptype, mtype, source, notes] of suwalkiTxs) {
    db.transactions.push({
      id: nextId(db, 'transactions'), city_id: suwalkiId, transaction_date: date,
      price, area, price_per_m2: ppm2, address: addr, property_type: ptype,
      market_type: mtype, source, notes, created_at: nowStr(),
    });
  }

  updateTransactionSnapshots(db, elkId);
  updateTransactionSnapshots(db, suwalkiId);
}

function updateTransactionSnapshots(db: DbData, cityId: number) {
  const txs = db.transactions.filter(t => t.city_id === cityId);
  const months = [...new Set(txs.map(t => t.transaction_date.substring(0, 7)))].sort();

  for (const month of months) {
    const monthTxs = txs.filter(t => t.transaction_date.startsWith(month));
    if (monthTxs.length === 0) continue;

    const prices = monthTxs.map(t => t.price_per_m2).sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

    const existingIdx = db.price_snapshots.findIndex(s => s.city_id === cityId && s.month === month && s.data_type === 'transaction');
    const snapshot: PriceSnapshot = {
      id: existingIdx >= 0 ? db.price_snapshots[existingIdx].id : nextId(db, 'price_snapshots'),
      city_id: cityId, month,
      avg_price_per_m2: Math.round(avg * 100) / 100,
      median_price_per_m2: Math.round(median * 100) / 100,
      min_price_per_m2: Math.min(...prices),
      max_price_per_m2: Math.max(...prices),
      listing_count: prices.length,
      data_type: 'transaction',
      created_at: nowStr(),
    };

    if (existingIdx >= 0) {
      db.price_snapshots[existingIdx] = snapshot;
    } else {
      db.price_snapshots.push(snapshot);
    }
  }
}

// ===== City Operations =====

export function getCities(): City[] {
  const db = loadDb();
  return [...db.cities].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export function getCity(slug: string): City | null {
  const db = loadDb();
  return db.cities.find(c => c.slug === slug) || null;
}

export function addCity(input: CityInput): City {
  const db = loadDb();
  if (db.cities.some(c => c.slug === input.slug)) {
    throw new Error('UNIQUE constraint failed');
  }
  const city: City = {
    id: nextId(db, 'cities'),
    name: input.name, slug: input.slug, voivodeship: input.voivodeship,
    voivodeship_slug: input.voivodeship_slug, otodom_city_slug: input.otodom_city_slug,
    created_at: nowStr(),
  };
  db.cities.push(city);
  saveDb(db);
  return city;
}

export function removeCity(slug: string): void {
  const db = loadDb();
  const city = db.cities.find(c => c.slug === slug);
  if (!city) return;
  const cid = city.id;
  const listingIds = new Set(db.listings.filter(l => l.city_id === cid).map(l => l.id));
  db.cities = db.cities.filter(c => c.slug !== slug);
  db.listings = db.listings.filter(l => l.city_id !== cid);
  db.transactions = db.transactions.filter(t => t.city_id !== cid);
  db.price_snapshots = db.price_snapshots.filter(s => s.city_id !== cid);
  db.refresh_log = db.refresh_log.filter(r => r.city_id !== cid);
  db.listing_price_history = db.listing_price_history.filter(h => !listingIds.has(h.listing_id));
  saveDb(db);
}

// ===== Listing Operations =====

export function getListings(cityId: number, marketType?: string): Listing[] {
  const db = loadDb();
  let result = db.listings.filter(l => l.city_id === cityId && l.is_active === 1);
  if (marketType) result = result.filter(l => l.market_type === marketType);
  return result.sort((a, b) => a.price_per_m2 - b.price_per_m2);
}

export function upsertListing(input: ListingInput): Listing {
  const db = loadDb();
  const existingIdx = db.listings.findIndex(l => l.city_id === input.city_id && l.external_id === input.external_id);

  if (existingIdx >= 0) {
    const existing = db.listings[existingIdx];
    if (existing.price !== input.price) {
      db.listing_price_history.push({
        id: nextId(db, 'listing_price_history'),
        listing_id: existing.id, price: input.price, price_per_m2: input.price_per_m2,
        recorded_at: todayStr(), created_at: nowStr(),
      });
    }
    db.listings[existingIdx] = {
      ...existing,
      title: input.title, price: input.price, area: input.area,
      price_per_m2: input.price_per_m2, rooms: input.rooms ?? null,
      floor: input.floor ?? null, developer: input.developer ?? null,
      address: input.address ?? null, url: input.url ?? null,
      last_seen: todayStr(), is_active: 1,
    };
    saveDb(db);
    return db.listings[existingIdx];
  } else {
    const listing: Listing = {
      id: nextId(db, 'listings'), city_id: input.city_id,
      external_id: input.external_id, title: input.title,
      price: input.price, area: input.area, price_per_m2: input.price_per_m2,
      rooms: input.rooms ?? null, floor: input.floor ?? null,
      developer: input.developer ?? null, address: input.address ?? null,
      url: input.url ?? null, market_type: input.market_type,
      first_seen: todayStr(), last_seen: todayStr(), is_active: 1,
      created_at: nowStr(),
    };
    db.listings.push(listing);
    db.listing_price_history.push({
      id: nextId(db, 'listing_price_history'),
      listing_id: listing.id, price: input.price, price_per_m2: input.price_per_m2,
      recorded_at: todayStr(), created_at: nowStr(),
    });
    saveDb(db);
    return listing;
  }
}

export function deactivateOldListings(cityId: number, activeExternalIds: string[]): number {
  const db = loadDb();
  const activeSet = new Set(activeExternalIds);
  let count = 0;
  for (const listing of db.listings) {
    if (listing.city_id === cityId && listing.is_active === 1 && !activeSet.has(listing.external_id)) {
      listing.is_active = 0;
      count++;
    }
  }
  if (count > 0) saveDb(db);
  return count;
}

// ===== Transaction Operations =====

export function getTransactions(cityId: number, limit?: number): Transaction[] {
  const db = loadDb();
  let result = db.transactions
    .filter(t => t.city_id === cityId)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  if (limit) result = result.slice(0, limit);
  return result;
}

export function addTransaction(input: TransactionInput): Transaction {
  const db = loadDb();
  const tx: Transaction = {
    id: nextId(db, 'transactions'), city_id: input.city_id,
    transaction_date: input.transaction_date, price: input.price,
    area: input.area, price_per_m2: input.price_per_m2,
    address: input.address ?? null, property_type: input.property_type || 'mieszkanie',
    market_type: input.market_type || 'pierwotny', source: input.source || 'manual',
    notes: input.notes ?? null, created_at: nowStr(),
  };
  db.transactions.push(tx);
  updateTransactionSnapshots(db, input.city_id);
  saveDb(db);
  return tx;
}

export function addTransactionsBulk(inputs: TransactionInput[]): number {
  const db = loadDb();
  const cityIds = new Set<number>();
  let count = 0;
  for (const input of inputs) {
    db.transactions.push({
      id: nextId(db, 'transactions'), city_id: input.city_id,
      transaction_date: input.transaction_date, price: input.price,
      area: input.area, price_per_m2: input.price_per_m2,
      address: input.address ?? null, property_type: input.property_type || 'mieszkanie',
      market_type: input.market_type || 'pierwotny', source: input.source || 'import',
      notes: input.notes ?? null, created_at: nowStr(),
    });
    count++;
    cityIds.add(input.city_id);
  }
  for (const cid of cityIds) updateTransactionSnapshots(db, cid);
  saveDb(db);
  return count;
}

export function deleteTransaction(id: number): void {
  const db = loadDb();
  const tx = db.transactions.find(t => t.id === id);
  db.transactions = db.transactions.filter(t => t.id !== id);
  if (tx) updateTransactionSnapshots(db, tx.city_id);
  saveDb(db);
}

// ===== Statistics =====

export function getListingStats(cityId: number) {
  const db = loadDb();
  const active = db.listings.filter(l => l.city_id === cityId && l.is_active === 1);

  if (active.length === 0) {
    return { total: 0, primary: 0, secondary: 0, avgPricePerM2: 0, medianPricePerM2: 0, minPricePerM2: 0, maxPricePerM2: 0, avgPrice: 0 };
  }

  const prices = active.map(l => l.price_per_m2).sort((a, b) => a - b);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
  const avgPrice = active.reduce((a, l) => a + l.price, 0) / active.length;

  return {
    total: active.length,
    primary: active.filter(l => l.market_type === 'primary').length,
    secondary: active.filter(l => l.market_type === 'secondary').length,
    avgPricePerM2: Math.round(avg * 100) / 100,
    medianPricePerM2: Math.round(median * 100) / 100,
    minPricePerM2: Math.min(...prices),
    maxPricePerM2: Math.max(...prices),
    avgPrice: Math.round(avgPrice * 100) / 100,
  };
}

export function getTransactionStats(cityId: number) {
  const db = loadDb();
  const txs = db.transactions.filter(t => t.city_id === cityId);

  if (txs.length === 0) {
    return { total: 0, avgPricePerM2: 0, medianPricePerM2: 0, last3Months: 0 };
  }

  const prices = txs.map(t => t.price_per_m2).sort((a, b) => a - b);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  const last3 = txs.filter(t => t.transaction_date >= cutoffStr).length;

  return {
    total: txs.length,
    avgPricePerM2: Math.round(avg * 100) / 100,
    medianPricePerM2: Math.round(median * 100) / 100,
    last3Months: last3,
  };
}

export function getPriceSnapshots(cityId: number, dataType?: string): PriceSnapshot[] {
  const db = loadDb();
  let result = db.price_snapshots.filter(s => s.city_id === cityId);
  if (dataType) result = result.filter(s => s.data_type === dataType);
  return result.sort((a, b) => a.month.localeCompare(b.month));
}

export function getPriceTrend(cityId: number): { direction: 'up' | 'down' | 'stable'; changePercent: number } {
  const db = loadDb();
  const snapshots = db.price_snapshots
    .filter(s => s.city_id === cityId && s.data_type === 'transaction')
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 3);

  if (snapshots.length < 2) return { direction: 'stable', changePercent: 0 };

  const latest = snapshots[0].avg_price_per_m2;
  const previous = snapshots[snapshots.length - 1].avg_price_per_m2;
  const change = ((latest - previous) / previous) * 100;

  return {
    direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
    changePercent: Math.round(change * 10) / 10,
  };
}

export function getLastRefreshDate(cityId: number): string | null {
  const db = loadDb();
  const logs = db.refresh_log
    .filter(r => r.city_id === cityId)
    .sort((a, b) => b.refreshed_at.localeCompare(a.refreshed_at));
  return logs[0]?.refreshed_at ?? null;
}

export function logRefresh(cityId: number, listingsFound: number, status: string, errorMessage?: string): void {
  const db = loadDb();
  db.refresh_log.push({
    id: nextId(db, 'refresh_log'),
    city_id: cityId, refreshed_at: nowStr(), listings_found: listingsFound,
    status, error_message: errorMessage ?? null,
  });
  saveDb(db);
}

export function createListingSnapshot(cityId: number): void {
  const db = loadDb();
  const month = currentMonth();
  const active = db.listings.filter(l => l.city_id === cityId && l.is_active === 1);
  if (active.length === 0) return;

  const prices = active.map(l => l.price_per_m2).sort((a, b) => a - b);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];

  const existingIdx = db.price_snapshots.findIndex(s => s.city_id === cityId && s.month === month && s.data_type === 'listing');
  const snapshot: PriceSnapshot = {
    id: existingIdx >= 0 ? db.price_snapshots[existingIdx].id : nextId(db, 'price_snapshots'),
    city_id: cityId, month,
    avg_price_per_m2: Math.round(avg * 100) / 100,
    median_price_per_m2: Math.round(median * 100) / 100,
    min_price_per_m2: Math.min(...prices),
    max_price_per_m2: Math.max(...prices),
    listing_count: prices.length,
    data_type: 'listing',
    created_at: nowStr(),
  };

  if (existingIdx >= 0) {
    db.price_snapshots[existingIdx] = snapshot;
  } else {
    db.price_snapshots.push(snapshot);
  }
  saveDb(db);
}
