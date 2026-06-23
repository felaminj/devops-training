export const PHIVOLCS_ARCHIVE_EARLIEST_YEAR = 2018;

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
] as const;

export type PhivolcsArchiveMonth = {
  year: number;
  month: number;
};

export function buildPhivolcsMonthlyArchiveUrl(
  baseUrl: string,
  year: number,
  month: number
): string {
  const monthName = MONTH_NAMES[month - 1] ?? 'January';
  return `${baseUrl}/EQLatest-Monthly/${year}/${year}_${monthName}.html`;
}

export function listPhivolcsArchiveMonths(
  startTime: number,
  now = Date.now()
): PhivolcsArchiveMonth[] {
  const earliestTime = Date.UTC(PHIVOLCS_ARCHIVE_EARLIEST_YEAR, 0, 1);
  const rangeStart = new Date(Math.max(startTime, earliestTime));
  const rangeEnd = new Date(now);
  const months: PhivolcsArchiveMonth[] = [];
  const cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), 1));
  const endStamp = Date.UTC(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), 1);
  while (cursor.getTime() <= endStamp) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export function listPhivolcsArchiveMonthsForFetch(
  startTime: number,
  now = Date.now()
): PhivolcsArchiveMonth[] {
  const current = new Date(now);
  const currentYear = current.getUTCFullYear();
  const currentMonth = current.getUTCMonth() + 1;
  return listPhivolcsArchiveMonths(startTime, now).filter(
    (entry) => !(entry.year === currentYear && entry.month === currentMonth)
  );
}

export function parsePhivolcsSlugMonth(slug: string): PhivolcsArchiveMonth | null {
  const year = Number(slug.slice(0, 4));
  const month = Number(slug.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  if (year < PHIVOLCS_ARCHIVE_EARLIEST_YEAR) return null;
  return { year, month };
}
