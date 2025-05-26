import {
  format as dfFormat,
  addDays as dfAddDays,
  subDays as dfSubDays,
  addHours as dfAddHours,
  subHours as dfSubHours,
  addMinutes as dfAddMinutes,
  subMinutes as dfSubMinutes,
  isFuture as dfIsFuture,
  isPast as dfIsPast,
  isSameDay as dfIsSameDay,
  startOfDay as dfStartOfDay,
  endOfDay as dfEndOfDay,
  getUnixTime,
  fromUnixTime,
  isLeapYear as dfIsLeapYear,
  compareAsc,
} from 'date-fns';
import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export type TimeZone = 'UTC' | 'IST' | string; // Allow string for other IANA timezones

const TIMEZONE_MAP: Record<'UTC' | 'IST', string> = {
  UTC: 'Etc/UTC',
  IST: 'Asia/Kolkata', // Asia/Kolkata is the IANA timezone for IST
};

/**
 * A utility class for date and time operations with persistent timezone context.
 * Defaults to the system's local timezone if not explicitly set.
 */
export class DateUtil {
  private static timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /**
   * Instantiates DateUtil. If a timezone is provided, it sets it as the static default.
   * @param tz Optional timezone string (e.g., 'UTC', 'IST', 'America/New_York').
   */
  constructor(tz?: TimeZone) {
    if (tz) {
      DateUtil.setTimezone(tz);
    }
  }

  /**
   * Sets the global default timezone for all DateUtil instances.
   * @param tz The timezone string (e.g., 'UTC', 'IST', 'America/New_York').
   */
  static setTimezone(tz: TimeZone): void {
    // Map 'UTC' and 'IST' to their IANA equivalents, otherwise use as is
    DateUtil.timezone = TIMEZONE_MAP[tz as 'UTC' | 'IST'] || tz;
  }

  /**
   * Gets the currently configured global timezone.
   * @returns The current timezone string.
   */
  getTimezone(): string {
    return DateUtil.timezone;
  }

  /**
   * Returns the current date and time in the configured timezone.
   * @returns A Date object representing the current time in the configured timezone.
   */
  now(): Date {
    const date = new Date();
    return toZonedTime(date, DateUtil.timezone);
  }

  /**
   * Formats a date into a string in the configured timezone.
   * @param date The date to format.
   * @param pattern The format string (e.g., 'yyyy-MM-dd HH:mm:ss'). Defaults to 'yyyy-MM-dd HH:mm:ss'.
   * @returns The formatted date string.
   */
  format(date: Date, pattern: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return formatInTimeZone(date, DateUtil.timezone, pattern);
  }

  /**
   * Converts a date to a Date object representing the same instant in the configured timezone.
   * This is useful for ensuring date operations are performed relative to a specific timezone.
   * @param date The date to convert.
   * @returns A new Date object representing the same instant but interpreted in the target timezone.
   */
  convertToTimeZone(date: Date): Date {
    return toZonedTime(date, DateUtil.timezone);
  }

  /**
   * Adds a specified number of days to a date.
   * @param date The base date.
   * @param days The number of days to add.
   * @returns A new Date object.
   */
  addDays(date: Date, days: number): Date {
    return dfAddDays(date, days);
  }

  /**
   * Subtracts a specified number of days from a date.
   * @param date The base date.
   * @param days The number of days to subtract.
   * @returns A new Date object.
   */
  subDays(date: Date, days: number): Date {
    return dfSubDays(date, days);
  }

  /**
   * Adds a specified number of hours to a date.
   * @param date The base date.
   * @param hours The number of hours to add.
   * @returns A new Date object.
   */
  addHours(date: Date, hours: number): Date {
    return dfAddHours(date, hours);
  }

  /**
   * Subtracts a specified number of hours from a date.
   * @param date The base date.
   * @param hours The number of hours to subtract.
   * @returns A new Date object.
   */
  subHours(date: Date, hours: number): Date {
    return dfSubHours(date, hours);
  }

  /**
   * Adds a specified number of minutes to a date.
   * @param date The base date.
   * @param minutes The number of minutes to add.
   * @returns A new Date object.
   */
  addMinutes(date: Date, minutes: number): Date {
    return dfAddMinutes(date, minutes);
  }

  /**
   * Subtracts a specified number of minutes from a date.
   * @param date The base date.
   * @param minutes The number of minutes to subtract.
   * @returns A new Date object.
   */
  subMinutes(date: Date, minutes: number): Date {
    return dfSubMinutes(date, minutes);
  }

  /**
   * Checks if a date is in the future relative to the current time in the configured timezone.
   * @param date The date to check.
   * @returns True if the date is in the future, false otherwise.
   */
  isFuture(date: Date): boolean {
    const zonedDate = toZonedTime(date, DateUtil.timezone);
    return dfIsFuture(zonedDate);
  }

  /**
   * Checks if a date is in the past relative to the current time in the configured timezone.
   * @param date The date to check.
   * @returns True if the date is in the past, false otherwise.
   */
  isPast(date: Date): boolean {
    const zonedDate = toZonedTime(date, DateUtil.timezone);
    return dfIsPast(zonedDate);
  }

  /**
   * Checks if a date is today in the configured timezone.
   * @param date The date to check.
   * @returns True if the date is today, false otherwise.
   */
  isToday(date: Date): boolean {
    const zonedDate = toZonedTime(date, DateUtil.timezone);
    const todayZoned = toZonedTime(new Date(), DateUtil.timezone);
    return dfIsSameDay(zonedDate, todayZoned);
  }

  /**
   * Checks if two dates are on the same day in the configured timezone.
   * @param a The first date.
   * @param b The second date.
   * @returns True if the dates are on the same day, false otherwise.
   */
  isSameDay(a: Date, b: Date): boolean {
    const zonedA = toZonedTime(a, DateUtil.timezone);
    const zonedB = toZonedTime(b, DateUtil.timezone);
    return dfIsSameDay(zonedA, zonedB);
  }

  /**
   * Returns a new Date object representing the start of the day for the given date in the configured timezone.
   * @param date The date.
   * @returns A new Date object set to the start of the day.
   */
  startOfDay(date: Date): Date {
    const zonedDate = toZonedTime(date, DateUtil.timezone);
    const start = dfStartOfDay(zonedDate);
    return fromZonedTime(start, DateUtil.timezone);
  }

  /**
   * Returns a new Date object representing the end of the day for the given date in the configured timezone.
   * @param date The date.
   * @returns A new Date object set to the end of the day.
   */
  endOfDay(date: Date): Date {
    const zonedDate = toZonedTime(date, DateUtil.timezone);
    const end = dfEndOfDay(zonedDate);
    return fromZonedTime(end, DateUtil.timezone);
  }

  /**
   * Compares two dates.
   * @param a The first date.
   * @param b The second date.
   * @returns A number indicating the comparison result (negative if a < b, positive if a > b, 0 if equal).
   */
  compareDates(a: Date, b: Date): number {
    return compareAsc(a, b);
  }

  /**
   * Calculates the number of full days between two dates.
   * @param a The first date.
   * @param b The second date.
   * @returns The number of full days between the dates.
   */
  daysBetween(a: Date, b: Date): number {
    const diff = Math.abs(dfStartOfDay(a).getTime() - dfStartOfDay(b).getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Converts a date to a Unix timestamp (seconds since epoch).
   * @param date The date to convert.
   * @returns The Unix timestamp.
   */
  toUnix(date: Date): number {
    return getUnixTime(date);
  }

  /**
   * Converts a Unix timestamp (seconds since epoch) to a Date object.
   * @param unix The Unix timestamp.
   * @returns A new Date object.
   */
  fromUnix(unix: number): Date {
    return fromUnixTime(unix);
  }

  /**
   * Checks if the year of a given date is a leap year.
   * @param date The date to check.
   * @returns True if the year is a leap year, false otherwise.
   */
  isLeapYear(date: Date): boolean {
    return dfIsLeapYear(date);
  }
}
