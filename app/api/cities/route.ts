import { NextRequest, NextResponse } from 'next/server';
import { getCities, addCity, removeCity } from '@/lib/db';
import { slugify } from '@/lib/utils';
import type { CityInput } from '@/lib/types';

export async function GET() {
  try {
    const cities = getCities();
    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, voivodeship, voivodeship_slug, otodom_city_slug } = body;

    if (!name || !voivodeship || !voivodeship_slug || !otodom_city_slug) {
      return NextResponse.json(
        { error: 'Wymagane pola: name, voivodeship, voivodeship_slug, otodom_city_slug' },
        { status: 400 }
      );
    }

    const input: CityInput = {
      name,
      slug: slugify(name),
      voivodeship,
      voivodeship_slug,
      otodom_city_slug,
    };

    const city = addCity(input);
    return NextResponse.json({ city }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'To miasto jest już dodane' }, { status: 409 });
    }
    console.error('Error adding city:', error);
    return NextResponse.json({ error: 'Failed to add city' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    removeCity(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing city:', error);
    return NextResponse.json({ error: 'Failed to remove city' }, { status: 500 });
  }
}
