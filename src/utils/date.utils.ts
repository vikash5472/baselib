export function now(): Date {
  return new Date();
}

export function formatDate(date: Date, format?: string): string {
  if (!format) return date.toISOString();
  // Simple YYYY-MM-DD, can be extended
  if (format === 'YYYY-MM-DD') {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

export function subHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() - hours);
  return d;
}

export function addMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

export function subMinutes(date: Date, minutes: number): Date {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - minutes);
  return d;
}

export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function compareDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

export function daysBetween(a: Date, b: Date): number {
  const diff = Math.abs(startOfDay(a).getTime() - startOfDay(b).getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function fromUnix(unix: number): Date {
  return new Date(unix * 1000);
}

export function isLeapYear(date: Date): boolean {
  const year = date.getFullYear();
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
} 