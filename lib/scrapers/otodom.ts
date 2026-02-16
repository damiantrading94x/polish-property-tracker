import * as cheerio from 'cheerio';
import type { OtodomListing, ScrapeResult } from '@/lib/types';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface OtodomSearchParams {
  voivodeshipSlug: string;
  citySlug: string;
  market?: 'PRIMARY' | 'SECONDARY' | 'ALL';
  page?: number;
  limit?: number;
}

function buildOtodomUrl(params: OtodomSearchParams): string {
  const { voivodeshipSlug, citySlug, market, page = 1, limit = 72 } = params;
  const base = `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/${voivodeshipSlug}/${citySlug}`;
  const searchParams = new URLSearchParams();
  
  if (market && market !== 'ALL') {
    searchParams.set('market', market);
  }
  if (page > 1) {
    searchParams.set('page', String(page));
  }
  searchParams.set('limit', String(limit));
  searchParams.set('by', 'DEFAULT');
  searchParams.set('direction', 'DESC');
  searchParams.set('viewType', 'listing');

  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}

export async function scrapeOtodom(
  voivodeshipSlug: string,
  citySlug: string,
  market: 'PRIMARY' | 'SECONDARY' | 'ALL' = 'PRIMARY'
): Promise<ScrapeResult> {
  try {
    const url = buildOtodomUrl({ voivodeshipSlug, citySlug, market });
    console.log(`[Otodom] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        listings: [],
        totalFound: 0,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    return parseOtodomHtml(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Otodom] Scrape error: ${message}`);
    return {
      success: false,
      listings: [],
      totalFound: 0,
      error: message,
    };
  }
}

function parseOtodomHtml(html: string): ScrapeResult {
  const $ = cheerio.load(html);
  
  // Try to extract __NEXT_DATA__ JSON
  const nextDataScript = $('script#__NEXT_DATA__').html();
  
  if (nextDataScript) {
    try {
      return parseNextData(JSON.parse(nextDataScript));
    } catch (e) {
      console.error('[Otodom] Failed to parse __NEXT_DATA__:', e);
    }
  }

  // Fallback: try to extract data from script tags containing listing data
  const scripts = $('script').toArray();
  for (const script of scripts) {
    const content = $(script).html() || '';
    if (content.includes('searchAds') || content.includes('listing')) {
      try {
        // Look for JSON data patterns
        const jsonMatch = content.match(/\{[^]*"searchAds"[^]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.searchAds?.items) {
            return parseSearchAdsItems(data.searchAds.items, data.searchAds.pagination?.totalResults || 0);
          }
        }
      } catch {
        // Continue searching
      }
    }
  }

  // Fallback: parse from HTML structure (less reliable)
  return parseFromHtmlStructure($);
}

function parseNextData(nextData: Record<string, unknown>): ScrapeResult {
  try {
    // Navigate the __NEXT_DATA__ structure
    const pageProps = (nextData.props as Record<string, unknown>)?.pageProps as Record<string, unknown>;
    if (!pageProps) {
      return { success: false, listings: [], totalFound: 0, error: 'No pageProps in __NEXT_DATA__' };
    }

    // Try different data paths (otodom changes their structure)
    let items: unknown[] = [];
    let totalResults = 0;

    // Path 1: data.searchAds
    const data = pageProps.data as Record<string, unknown>;
    if (data?.searchAds) {
      const searchAds = data.searchAds as Record<string, unknown>;
      items = (searchAds.items as unknown[]) || [];
      totalResults = ((searchAds.pagination as Record<string, number>)?.totalResults) || items.length;
    }

    // Path 2: ads (older format)
    if (items.length === 0 && pageProps.ads) {
      const ads = pageProps.ads as Record<string, unknown>;
      items = (ads.items as unknown[]) || [];
      totalResults = ((ads.pagination as Record<string, number>)?.totalResults) || items.length;
    }

    // Path 3: initialProps
    if (items.length === 0 && pageProps.initialProps) {
      const initialProps = pageProps.initialProps as Record<string, unknown>;
      const searchData = initialProps.data as Record<string, unknown>;
      if (searchData?.searchAds) {
        const searchAds = searchData.searchAds as Record<string, unknown>;
        items = (searchAds.items as unknown[]) || [];
        totalResults = ((searchAds.pagination as Record<string, number>)?.totalResults) || items.length;
      }
    }

    if (items.length === 0) {
      return { success: false, listings: [], totalFound: 0, error: 'No listing items found in __NEXT_DATA__' };
    }

    return parseSearchAdsItems(items, totalResults);
  } catch (error) {
    return {
      success: false,
      listings: [],
      totalFound: 0,
      error: `Failed to parse __NEXT_DATA__: ${error instanceof Error ? error.message : 'unknown'}`,
    };
  }
}

function parseSearchAdsItems(items: unknown[], totalResults: number): ScrapeResult {
  const listings: OtodomListing[] = [];

  for (const item of items) {
    try {
      const ad = item as Record<string, unknown>;
      const id = String(ad.id || ad.slug || '');
      if (!id) continue;

      // Price
      let price = 0;
      if (typeof ad.totalPrice === 'object' && ad.totalPrice !== null) {
        price = (ad.totalPrice as Record<string, number>).value || 0;
      } else if (typeof ad.totalPrice === 'number') {
        price = ad.totalPrice;
      } else if (typeof ad.price === 'object' && ad.price !== null) {
        price = (ad.price as Record<string, number>).value || 0;
      }

      // Area
      let area = 0;
      if (typeof ad.areaInSquareMeters === 'number') {
        area = ad.areaInSquareMeters;
      } else if (typeof ad.area === 'number') {
        area = ad.area;
      }

      // Price per m2
      let pricePerM2 = 0;
      if (typeof ad.pricePerSquareMeter === 'object' && ad.pricePerSquareMeter !== null) {
        pricePerM2 = (ad.pricePerSquareMeter as Record<string, number>).value || 0;
      } else if (typeof ad.pricePerSquareMeter === 'number') {
        pricePerM2 = ad.pricePerSquareMeter;
      } else if (price > 0 && area > 0) {
        pricePerM2 = price / area;
      }

      if (price === 0 || area === 0) continue;

      // Rooms
      let rooms: number | null = null;
      if (typeof ad.roomsNumber === 'number') {
        rooms = ad.roomsNumber;
      } else if (typeof ad.rooms === 'number') {
        rooms = ad.rooms;
      } else if (typeof ad.roomsNumber === 'string') {
        rooms = parseInt(ad.roomsNumber, 10) || null;
      }

      // Floor
      let floor: number | null = null;
      if (typeof ad.floor === 'number') {
        floor = ad.floor;
      } else if (typeof ad.floorNumber === 'number') {
        floor = ad.floorNumber;
      }

      // Developer / agency
      let developer: string | null = null;
      if (ad.agency && typeof ad.agency === 'object') {
        developer = (ad.agency as Record<string, string>).name || null;
      }

      // Address
      let address: string | null = null;
      if (ad.location && typeof ad.location === 'object') {
        const loc = ad.location as Record<string, unknown>;
        const addr = loc.address as Record<string, Record<string, string>> | undefined;
        if (addr) {
          const street = addr.street?.name || '';
          const district = addr.district?.name || '';
          address = [street, district].filter(Boolean).join(', ') || null;
        }
      }

      // URL
      const slug = ad.slug || id;
      const url = `https://www.otodom.pl/pl/oferta/${slug}`;

      listings.push({
        id: String(id),
        title: String(ad.title || ''),
        price,
        area: Math.round(area * 100) / 100,
        pricePerM2: Math.round(pricePerM2 * 100) / 100,
        rooms,
        floor,
        developer,
        address,
        url,
      });
    } catch {
      // Skip problematic items
      continue;
    }
  }

  return {
    success: true,
    listings,
    totalFound: totalResults || listings.length,
  };
}

function parseFromHtmlStructure($: cheerio.CheerioAPI): ScrapeResult {
  const listings: OtodomListing[] = [];

  // Try to parse listing cards from the HTML
  $('[data-cy="listing-item"], [data-testid="listing-item"], article[data-featured-name]').each((_, el) => {
    try {
      const $el = $(el);
      const link = $el.find('a[href*="/oferta/"]').first();
      const href = link.attr('href') || '';
      const id = href.split('/').pop()?.split('?')[0] || String(Math.random());

      const title = $el.find('[data-cy="listing-item-title"], h3, h2').first().text().trim();

      // Price text - extract number
      const priceText = $el.find('[data-cy="listing-item-price"], [aria-label*="Cena"]').first().text();
      const price = parsePolishNumber(priceText);

      // Area
      const areaText = $el.find('span:contains("m²")').first().text();
      const area = parsePolishNumber(areaText);

      if (!price || !area) return;

      const pricePerM2 = price / area;

      // Rooms
      const roomsText = $el.find('span:contains("poko")').first().text();
      const rooms = parseInt(roomsText, 10) || null;

      const url = href.startsWith('http') ? href : `https://www.otodom.pl${href}`;

      listings.push({
        id,
        title: title || 'Mieszkanie',
        price,
        area: Math.round(area * 100) / 100,
        pricePerM2: Math.round(pricePerM2 * 100) / 100,
        rooms,
        floor: null,
        developer: null,
        address: null,
        url,
      });
    } catch {
      // Skip problematic elements
    }
  });

  return {
    success: listings.length > 0,
    listings,
    totalFound: listings.length,
    error: listings.length === 0 ? 'Nie znaleziono ogłoszeń w HTML (możliwa zmiana struktury strony otodom)' : undefined,
  };
}

function parsePolishNumber(text: string): number {
  if (!text) return 0;
  // Remove everything except digits, comma, and dot
  const cleaned = text.replace(/[^\d,.\s]/g, '').trim();
  // Handle Polish number format: 350 000,50 or 350000.50
  const normalized = cleaned.replace(/\s/g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}
