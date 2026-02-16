import { NextRequest, NextResponse } from 'next/server';
import { getCity, getListings } from '@/lib/db';

export async function GET(
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
    const market = searchParams.get('market') || undefined;

    const listings = getListings(city.id, market);
    return NextResponse.json({ listings, total: listings.length });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
