// ===== Database Entities =====

export interface City {
  id: number;
  name: string;
  slug: string;
  voivodeship: string;
  voivodeship_slug: string; // for otodom URL
  otodom_city_slug: string; // city segment in otodom URL
  created_at: string;
}

export interface CityInput {
  name: string;
  slug: string;
  voivodeship: string;
  voivodeship_slug: string;
  otodom_city_slug: string;
}

export interface Listing {
  id: number;
  city_id: number;
  external_id: string;
  title: string;
  price: number;
  area: number;
  price_per_m2: number;
  rooms: number | null;
  floor: number | null;
  developer: string | null;
  address: string | null;
  url: string | null;
  market_type: 'primary' | 'secondary';
  first_seen: string;
  last_seen: string;
  is_active: number;
  created_at: string;
}

export interface ListingInput {
  city_id: number;
  external_id: string;
  title: string;
  price: number;
  area: number;
  price_per_m2: number;
  rooms?: number | null;
  floor?: number | null;
  developer?: string | null;
  address?: string | null;
  url?: string | null;
  market_type: 'primary' | 'secondary';
}

export interface ListingPriceHistory {
  id: number;
  listing_id: number;
  price: number;
  price_per_m2: number;
  recorded_at: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  city_id: number;
  transaction_date: string;
  price: number;
  area: number;
  price_per_m2: number;
  address: string | null;
  property_type: string;
  market_type: string;
  source: string;
  notes: string | null;
  created_at: string;
}

export interface TransactionInput {
  city_id: number;
  transaction_date: string;
  price: number;
  area: number;
  price_per_m2: number;
  address?: string | null;
  property_type?: string;
  market_type?: string;
  source?: string;
  notes?: string | null;
}

export interface PriceSnapshot {
  id: number;
  city_id: number;
  month: string; // YYYY-MM
  avg_price_per_m2: number;
  median_price_per_m2: number;
  min_price_per_m2: number;
  max_price_per_m2: number;
  listing_count: number;
  data_type: 'listing' | 'transaction';
  created_at: string;
}

// ===== API Response Types =====

export interface CityStats {
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
    period: string;
  };
  priceHistory: PriceSnapshot[];
}

export interface CityCardData {
  city: City;
  listingCount: number;
  avgPricePerM2: number;
  transactionCount: number;
  avgTransactionPricePerM2: number;
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
  };
  lastRefreshed: string | null;
}

export interface OtodomListing {
  id: string;
  title: string;
  price: number;
  area: number;
  pricePerM2: number;
  rooms: number | null;
  floor: number | null;
  developer: string | null;
  address: string | null;
  url: string;
}

export interface ScrapeResult {
  success: boolean;
  listings: OtodomListing[];
  totalFound: number;
  error?: string;
}

// ===== CSV Import =====

export interface CSVTransactionRow {
  data: string;
  cena: string;
  powierzchnia: string;
  adres?: string;
  typ_rynku?: string;
  typ_nieruchomosci?: string;
  uwagi?: string;
}
