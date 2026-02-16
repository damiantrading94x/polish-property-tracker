export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPricePerM2(price: number): string {
  return `${new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)} zł/m²`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
    'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru',
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Detect separator (comma, semicolon, or tab)
  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes(';')) separator = ';';
  else if (firstLine.includes('\t')) separator = '\t';

  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/["\s]/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length < 2) continue; // Skip empty/invalid lines

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

export function trendColor(direction: 'up' | 'down' | 'stable'): string {
  switch (direction) {
    case 'up': return 'text-red-400';    // Rising prices = red (bad for buyers)
    case 'down': return 'text-green-400'; // Falling prices = green (good for buyers)
    case 'stable': return 'text-slate-400';
  }
}

export function trendIcon(direction: 'up' | 'down' | 'stable'): string {
  switch (direction) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
  }
}
