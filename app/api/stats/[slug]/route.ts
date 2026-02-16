import { NextRequest, NextResponse } from 'next/server';
import { getCity, getListingStats, getTransactionStats, getPriceSnapshots, getPriceTrend, getLastRefreshDate } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const city = getCity(slug);
    if (!city) {
      return NextResponse.json({ error: 'Miasto nie znalezione' }, { status: 404 });
    }

    const listingStats = getListingStats(city.id);
    const transactionStats = getTransactionStats(city.id);
    const priceHistory = getPriceSnapshots(city.id);
    const trend = getPriceTrend(city.id);
    const lastRefreshed = getLastRefreshDate(city.id);

    return NextResponse.json({
      city,
      listings: listingStats,
      transactions: transactionStats,
      trend,
      priceHistory,
      lastRefreshed,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
