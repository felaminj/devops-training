import type { Earthquake } from '@earthquake/shared-types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DATE_TIME_PATTERN =
  /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*-\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i;

export type PhivolcsIndexRow = {
  dateTimeText: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  place: string;
  bulletinSlug: string | null;
};

export type PhivolcsBulletinDetails = {
  dateTimeText: string | null;
  location: string | null;
  depthKm: number | null;
  origin: string | null;
  magnitudeText: string | null;
  instrumentalIntensity: string | null;
  epicentralMapUrl: string | null;
  expectingDamage: boolean | null;
  expectingAftershocks: boolean | null;
  issuedOn: string | null;
};

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePhivolcsDateTimePst(value: string): number | null {
  const match = value.match(DATE_TIME_PATTERN);
  if (!match) return null;

  const day = Number(match[1]);
  const monthName = match[2] ?? '';
  const year = Number(match[3]);
  let hour = Number(match[4]);
  const minute = Number(match[5]);
  const meridiem = (match[6] ?? '').toUpperCase();
  const month = MONTH_NAMES.findIndex((name) => name.toLowerCase() === monthName.toLowerCase());
  if (month < 0) return null;

  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  return Date.UTC(year, month, day, hour - 8, minute);
}

function parseMagnitudeValue(value: string): number | null {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parseMagType(value: string): string | null {
  const match = value.match(/^([A-Za-z]+)/);
  return match?.[1] ?? null;
}

function parseYesNo(value: string): boolean | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'YES') return true;
  if (normalized === 'NO') return false;
  return null;
}

function extractMarkerValue(html: string, marker: string): string | null {
  const index = html.indexOf(marker);
  if (index < 0) return null;
  const chunk = html.slice(index, index + 500);
  const match = chunk.match(/-->\s*([\s\S]*?)<\/span>/);
  return match?.[1] ? stripHtml(match[1]) : null;
}

export function parsePhivolcsIndexRows(html: string): PhivolcsIndexRow[] {
  const rows: PhivolcsIndexRow[] = [];
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    const rowHtml = rowMatch[1];
    if (!rowHtml) continue;

    const cellMatches = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (cellMatches.length !== 6) continue;

    const cells = cellMatches.map((cell) => stripHtml(cell[1] ?? ''));
    const dateTimeText = cells[0] ?? '';
    if (!DATE_TIME_PATTERN.test(dateTimeText)) continue;

    const bulletinMatch = rowHtml.match(/href="([^"]+\.html)"/i);
    const bulletinPath = bulletinMatch?.[1]?.replace(/\\/g, '/') ?? null;
    const bulletinSlug = bulletinPath
      ? bulletinPath.split('/').pop()?.replace(/\.html$/i, '') ?? null
      : null;

    rows.push({
      dateTimeText,
      latitude: Number(cells[1] ?? 0),
      longitude: Number(cells[2] ?? 0),
      depth: Number(cells[3] ?? 0),
      magnitude: Number(cells[4] ?? 0),
      place: cells[5] ?? '',
      bulletinSlug,
    });
  }

  return rows;
}

export function parseEpicentralMapUrl(html: string, bulletinUrl: string): string | null {
  const match = html.match(/Map-Data[\s\S]*?<img[^>]*\ssrc\s*=\s*["'\s]*([^"'>\s]+)/i);
  if (!match?.[1]) return null;
  const relative = match[1].trim();
  if (relative.startsWith('http')) return relative;
  const base = bulletinUrl.replace(/[^/]+$/, '');
  return `${base}${relative}`;
}

export function parsePhivolcsBulletin(html: string, bulletinUrl = ''): PhivolcsBulletinDetails {
  const magnitudeText = extractMarkerValue(html, '<!-- 6 Magnitude-Data  -->');
  const intensityMatch = html.match(/Instrumental Intensity:.*?<br><br>([\s\S]*?)<\/span>/i);

  return {
    dateTimeText: extractMarkerValue(html, '<!-- 2 DateTime-Data  -->'),
    location: extractMarkerValue(html, '<!-- 3 Location-Data  -->'),
    depthKm: Number(extractMarkerValue(html, '<!-- 4 Depth-Data  -->')) || null,
    origin: extractMarkerValue(html, '<!-- 5 Origin-Data  -->'),
    magnitudeText,
    instrumentalIntensity: intensityMatch?.[1] ? stripHtml(intensityMatch[1]) : null,
    epicentralMapUrl: bulletinUrl ? parseEpicentralMapUrl(html, bulletinUrl) : null,
    expectingDamage: parseYesNo(extractMarkerValue(html, '<!-- 8 Damage-Data  -->') ?? ''),
    expectingAftershocks: parseYesNo(extractMarkerValue(html, '<!-- 9 Aftershock-Data  -->') ?? ''),
    issuedOn: extractMarkerValue(html, '<!-- 10 IssuedDT-Data  -->'),
  };
}

export function bulletinUrlFromSlug(baseUrl: string, slug: string): string {
  const year = slug.slice(0, 4);
  const month = Number(slug.slice(5, 7));
  const monthName = MONTH_NAMES[month - 1] ?? 'January';
  return `${baseUrl}/${year}_Earthquake_Information/${monthName}/${slug}.html`;
}

export function toPhivolcsEarthquakeId(slug: string): string {
  return `phivolcs:${slug}`;
}

export function slugFromPhivolcsEarthquakeId(id: string): string {
  return id.replace(/^phivolcs:/, '');
}

export function parsePhivolcsLocation(value: string | null): {
  latitude: number;
  longitude: number;
  place: string;
} | null {
  if (!value) return null;
  const normalized = value.replace(/°/g, '').trim();
  const match = normalized.match(
    /([\d.]+)\s*([NS])\s*,\s*([\d.]+)\s*([EW])(?:\s*-\s*(.+))?/i
  );
  if (!match) return null;
  let latitude = Number(match[1]);
  let longitude = Number(match[3]);
  if (match[2]?.toUpperCase() === 'S') latitude = -latitude;
  if (match[4]?.toUpperCase() === 'W') longitude = -longitude;
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  const place = (match[5] ?? value).trim();
  return { latitude, longitude, place };
}

export function mapPhivolcsBulletinToEarthquake(
  slug: string,
  bulletin: PhivolcsBulletinDetails,
  baseUrl: string
): Earthquake | null {
  const dateTimeText = bulletin.dateTimeText;
  if (!dateTimeText) return null;
  const time = parsePhivolcsDateTimePst(dateTimeText);
  if (time === null) return null;
  const location = parsePhivolcsLocation(bulletin.location);
  if (!location) return null;
  const magnitudeText = bulletin.magnitudeText ?? '';
  const magnitude = parseMagnitudeValue(magnitudeText);
  const bulletinUrl = bulletinUrlFromSlug(baseUrl, slug);
  return {
    id: toPhivolcsEarthquakeId(slug),
    magnitude,
    place: location.place,
    time,
    latitude: location.latitude,
    longitude: location.longitude,
    depth: bulletin.depthKm ?? 0,
    url: bulletinUrl,
    tsunami: false,
    significance: Math.round((magnitude ?? 0) * 100),
    status: bulletin.issuedOn ? 'reviewed' : 'automatic',
    magType: parseMagType(magnitudeText),
    title: `M ${magnitude ?? '?'} - ${location.place}`,
    dataSource: 'phivolcs',
    epicentralMapUrl: bulletin.epicentralMapUrl ?? null,
    instrumentalIntensity: bulletin.instrumentalIntensity ?? null,
    expectingDamage: bulletin.expectingDamage ?? null,
    expectingAftershocks: bulletin.expectingAftershocks ?? null,
    origin: bulletin.origin ?? null,
  };
}

export function mapPhivolcsRowToEarthquake(
  row: PhivolcsIndexRow,
  baseUrl: string,
  bulletin?: PhivolcsBulletinDetails
): Earthquake | null {
  const dateTimeText = bulletin?.dateTimeText ?? row.dateTimeText;
  const time = parsePhivolcsDateTimePst(dateTimeText);
  if (time === null) return null;

  const magnitudeText = bulletin?.magnitudeText ?? String(row.magnitude);
  const magnitude = parseMagnitudeValue(magnitudeText) ?? row.magnitude;
  const slug = row.bulletinSlug ?? createFallbackSlug(row);
  const bulletinUrl = row.bulletinSlug
    ? bulletinUrlFromSlug(baseUrl, row.bulletinSlug)
    : null;

  return {
    id: toPhivolcsEarthquakeId(slug),
    magnitude,
    place: bulletin?.location ?? row.place,
    time,
    latitude: row.latitude,
    longitude: row.longitude,
    depth: bulletin?.depthKm ?? row.depth,
    url: bulletinUrl,
    tsunami: false,
    significance: Math.round((magnitude ?? 0) * 100),
    status: bulletin?.issuedOn ? 'reviewed' : 'automatic',
    magType: parseMagType(magnitudeText),
    title: `M ${magnitude ?? '?'} - ${bulletin?.location ?? row.place}`,
    dataSource: 'phivolcs',
    epicentralMapUrl: bulletin?.epicentralMapUrl ?? null,
    instrumentalIntensity: bulletin?.instrumentalIntensity ?? null,
    expectingDamage: bulletin?.expectingDamage ?? null,
    expectingAftershocks: bulletin?.expectingAftershocks ?? null,
    origin: bulletin?.origin ?? null,
  };
}

function createFallbackSlug(row: PhivolcsIndexRow): string {
  const time = parsePhivolcsDateTimePst(row.dateTimeText);
  const stamp = time ? new Date(time).toISOString().replace(/[-:TZ.]/g, '').slice(0, 12) : 'unknown';
  return `${stamp}_${row.latitude}_${row.longitude}`.replace(/\./g, '');
}
