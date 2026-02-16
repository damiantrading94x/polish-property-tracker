import { NextRequest, NextResponse } from 'next/server';
import { getCity, getTransactions, addTransaction, addTransactionsBulk, deleteTransaction } from '@/lib/db';
import { parseCSV } from '@/lib/utils';
import type { TransactionInput } from '@/lib/types';

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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const transactions = getTransactions(city.id, limit);
    return NextResponse.json({ transactions, total: transactions.length });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

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

    const contentType = request.headers.get('content-type') || '';

    // Handle CSV import
    if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      const csvText = await request.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Pusty plik CSV lub nieprawidłowy format' }, { status: 400 });
      }

      const inputs: TransactionInput[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const price = parseFloat(row.cena?.replace(/\s/g, '').replace(',', '.') || '0');
          const area = parseFloat(row.powierzchnia?.replace(/\s/g, '').replace(',', '.') || '0');

          if (!price || !area) {
            errors.push(`Wiersz ${i + 2}: brak ceny lub powierzchni`);
            continue;
          }

          inputs.push({
            city_id: city.id,
            transaction_date: row.data || new Date().toISOString().split('T')[0],
            price,
            area,
            price_per_m2: Math.round((price / area) * 100) / 100,
            address: row.adres || null,
            property_type: row.typ_nieruchomosci || 'mieszkanie',
            market_type: row.typ_rynku || 'pierwotny',
            source: 'import',
            notes: row.uwagi || null,
          });
        } catch {
          errors.push(`Wiersz ${i + 2}: błąd parsowania`);
        }
      }

      if (inputs.length === 0) {
        return NextResponse.json({ error: 'Nie udało się sparsować żadnych transakcji', errors }, { status: 400 });
      }

      const imported = addTransactionsBulk(inputs);
      return NextResponse.json({
        success: true,
        imported,
        errors: errors.length > 0 ? errors : undefined,
      }, { status: 201 });
    }

    // Handle single transaction JSON
    const body = await request.json();
    const { transaction_date, price, area, address, property_type, market_type, notes } = body;

    if (!transaction_date || !price || !area) {
      return NextResponse.json(
        { error: 'Wymagane pola: transaction_date, price, area' },
        { status: 400 }
      );
    }

    const priceNum = parseFloat(price);
    const areaNum = parseFloat(area);

    const input: TransactionInput = {
      city_id: city.id,
      transaction_date,
      price: priceNum,
      area: areaNum,
      price_per_m2: Math.round((priceNum / areaNum) * 100) / 100,
      address: address || null,
      property_type: property_type || 'mieszkanie',
      market_type: market_type || 'pierwotny',
      source: 'manual',
      notes: notes || null,
    };

    const transaction = addTransaction(input);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await params; // consume params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    deleteTransaction(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
