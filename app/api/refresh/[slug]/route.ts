import { NextRequest, NextResponse } from 'next/server';
import { getCity, upsertListing, deactivateOldListings, logRefresh, createListingSnapshot } from '@/lib/db';
import { scrapeOtodom } from '@/lib/scrapers/otodom';
import type { ListingInput } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const city = getCity(slug);
    if (!city) {
      return NextResponse.json({ error: 'Miasto nie znalezione' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const market = (searchParams.get('market') || 'PRIMARY') as 'PRIMARY' | 'SECONDARY' | 'ALL';

    console.log(`[Refresh] Starting scrape for ${city.name} (${market})`);

    const result = await scrapeOtodom(city.voivodeship_slug, city.otodom_city_slug, market);

    if (!result.success) {
      logRefresh(city.id, 0, 'error', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        message: `Nie udało się pobrać danych z Otodom. ${result.error}`,
        hint: 'Otodom może blokować automatyczne zapytania. Spróbuj ponownie później lub dodaj oferty ręcznie.',
      }, { status: 200 }); // 200 because it's not a server error, just scraping failed
    }

    // Process scraped listings
    const activeIds: string[] = [];
    let newCount = 0;
    let updatedCount = 0;

    for (const listing of result.listings) {
      const input: ListingInput = {
        city_id: city.id,
        external_id: listing.id,
        title: listing.title,
        price: listing.price,
        area: listing.area,
        price_per_m2: listing.pricePerM2,
        rooms: listing.rooms,
        floor: listing.floor,
        developer: listing.developer,
        address: listing.address,
        url: listing.url,
        market_type: market === 'SECONDARY' ? 'secondary' : 'primary',
      };

      const upserted = upsertListing(input);
      activeIds.push(listing.id);

      if (upserted.first_seen === upserted.last_seen) {
        newCount++;
      } else {
        updatedCount++;
      }
    }

    // Deactivate listings that are no longer found
    const deactivated = deactivateOldListings(city.id, activeIds);

    // Create listing price snapshot
    createListingSnapshot(city.id);

    // Log the refresh
    logRefresh(city.id, result.listings.length, 'success');

    return NextResponse.json({
      success: true,
      totalFound: result.totalFound,
      scraped: result.listings.length,
      new: newCount,
      updated: updatedCount,
      deactivated,
    });
  } catch (error) {
    console.error('Error refreshing listings:', error);
    return NextResponse.json({ error: 'Failed to refresh listings' }, { status: 500 });
  }
}
