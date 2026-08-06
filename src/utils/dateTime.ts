/**
 * Simple Date/Time helper functions to avoid loading huge external libraries.
 */

export function format(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');

  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    hh: pad(d.getHours() % 12 || 12),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
    A: d.getHours() >= 12 ? 'PM' : 'AM',
  };

  return formatStr.replace(/YYYY|MM|DD|hh|HH|mm|ss|A/g, (matched) => map[matched]);
}

export function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export function formatLocalDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}


