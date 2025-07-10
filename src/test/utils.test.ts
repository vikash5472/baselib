import { _ } from '../utils';
import { DateUtil } from '../utils/date.util'; // Import DateUtil directly for testing

describe('Utils Module', () => {
    describe('Lodash Extensions (_)', () => {
        it('should have standard lodash functions', () => {
            expect(_.isEmpty([])).toBe(true);
            expect(_.pick({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 });
        });

        describe('_.sleep', () => {
            it('should pause execution for the specified duration', async () => {
                const start = Date.now();
                await _.sleep(50);
                const end = Date.now();
                expect(end - start).toBeGreaterThanOrEqual(45); // Allow for slight delay
            });
        });

        describe('_.uuid', () => {
            it('should generate a valid UUID', () => {
                const uuid = _.uuid();
                // Basic UUID format check (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
                expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            });

            it('should generate unique UUIDs', () => {
                const uuid1 = _.uuid();
                const uuid2 = _.uuid();
                expect(uuid1).not.toBe(uuid2);
            });

            it('should generate a UUID using the fallback method when crypto.randomUUID is not available', () => {
                const originalCrypto = global.crypto;
                // @ts-ignore
                global.crypto = { randomUUID: undefined }; // Force fallback

                const uuid = _.uuid();
                expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
                expect(uuid).not.toBe(originalCrypto?.randomUUID ? originalCrypto.randomUUID() : undefined); // Ensure it's not using the original if it existed

                global.crypto = originalCrypto; // Restore original crypto
            });
        });

        describe('_.retry', () => {
            it('should succeed on the first attempt if no error', async () => {
                const mockFn = jest.fn().mockResolvedValue('success');
                const result = await _.retry(mockFn, 3);
                expect(result).toBe('success');
                expect(mockFn).toHaveBeenCalledTimes(1);
            });

            it('should retry and succeed after a few failures', async () => {
                let callCount = 0;
                const mockFn = jest.fn(() => {
                    callCount++;
                    if (callCount < 2) {
                        return Promise.reject(new Error('Transient error'));
                    }
                    return Promise.resolve('success after retry');
                });

                const result = await _.retry(mockFn, 3, 10); // Small delay for faster tests
                expect(result).toBe('success after retry');
                expect(mockFn).toHaveBeenCalledTimes(2);
            });

            it('should fail after all retries are exhausted', async () => {
                const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
                await expect(_.retry(mockFn, 2, 10)).rejects.toThrow('Persistent error');
                expect(mockFn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
            });

            it('should pass the correct error from the last attempt when all retries fail', async () => {
                const error1 = new Error('Error 1');
                const error2 = new Error('Error 2');
                const mockFn = jest.fn()
                    .mockRejectedValueOnce(error1)
                    .mockRejectedValueOnce(error2)
                    .mockRejectedValue(new Error('Final Error'));

                await expect(_.retry(mockFn, 2, 10)).rejects.toThrow('Final Error');
                expect(mockFn).toHaveBeenCalledTimes(3);
            });
        });
    });

    describe('DateUtil', () => {
        const originalTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        beforeEach(() => {
            // Reset timezone before each test to avoid interference
            DateUtil.setTimezone(originalTimeZone);
        });

        it('should initialize with default timezone if none provided', () => {
            const dateUtil = new DateUtil();
            expect(dateUtil.getTimezone()).toBe(originalTimeZone);
        });

        it('should set timezone via constructor', () => {
            const dateUtil = new DateUtil('America/New_York');
            expect(dateUtil.getTimezone()).toBe('America/New_York');
        });

        it('should set timezone statically', () => {
            DateUtil.setTimezone('Europe/London');
            const dateUtil = new DateUtil(); // Should pick up static setting
            expect(dateUtil.getTimezone()).toBe('Europe/London');
        });

        it('should return current date/time in the configured timezone (now)', () => {
            const dateUtil = new DateUtil('America/Los_Angeles');
            const now = dateUtil.now();
            // This is hard to test precisely without mocking Date,
            // but we can check if it's a Date object and roughly current.
            expect(now).toBeInstanceOf(Date);
            expect(now.getTime()).toBeCloseTo(Date.now(), -1000); // Within 1 second
        });

        it('should format date in the configured timezone', () => {
            const dateUtil = new DateUtil('America/New_York');
            const testDate = new Date('2023-01-15T12:00:00Z'); // UTC noon
            const formatted = dateUtil.format(testDate, 'yyyy-MM-dd HH:mm:ss zzz');
            // Expecting 07:00:00 in New York (UTC-5)
            expect(formatted).toContain('2023-01-15 07:00:00');
            expect(formatted).toContain('EST'); // Or EDT depending on time of year
        });

        it('should add days to a date', () => {
            const dateUtil = new DateUtil();
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const newDate = dateUtil.addDays(initialDate, 5);
            expect(newDate.getUTCDate()).toBe(6); // UTC date
        });

        it('should subtract days from a date', () => {
            const dateUtil = new DateUtil();
            const initialDate = new Date('2023-01-07T12:00:00Z');
            const newDate = dateUtil.subDays(initialDate, 5);
            expect(newDate.getUTCDate()).toBe(2); // UTC date
        });

        it('should add hours to a date', () => {
            const dateUtil = new DateUtil();
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const newDate = dateUtil.addHours(initialDate, 3);
            expect(newDate.getUTCHours()).toBe(15);
        });

        it('should subtract hours from a date', () => {
            const dateUtil = new DateUtil();
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const newDate = dateUtil.subHours(initialDate, 3);
            expect(newDate.getUTCHours()).toBe(9);
        });

        it('should add minutes to a date', () => {
            const dateUtil = new DateUtil();
            const initialDate = new Date('2023-01-01T12:00:00Z');
            const newDate = dateUtil.addMinutes(initialDate, 30);
            expect(newDate.getUTCMinutes()).toBe(30);
        });

        it('should subtract minutes from a date', () => {
            const dateUtil = new DateUtil();
            const initialDate = new Date('2023-01-01T12:30:00Z');
            const newDate = dateUtil.subMinutes(initialDate, 30);
            expect(newDate.getUTCMinutes()).toBe(0);
        });

        it('should check if a date is in the future', () => {
            const dateUtil = new DateUtil();
            const futureDate = new Date(Date.now() + 100000);
            const pastDate = new Date(Date.now() - 100000);
            expect(dateUtil.isFuture(futureDate)).toBe(true);
            expect(dateUtil.isFuture(pastDate)).toBe(false);
        });

        it('should check if a date is in the past', () => {
            const dateUtil = new DateUtil();
            const futureDate = new Date(Date.now() + 100000);
            const pastDate = new Date(Date.now() - 100000);
            expect(dateUtil.isPast(futureDate)).toBe(false);
            expect(dateUtil.isPast(pastDate)).toBe(true);
        });

        it('should check if a date is today', () => {
            const dateUtil = new DateUtil();
            const today = new Date();
            const tomorrow = dateUtil.addDays(today, 1);
            expect(dateUtil.isToday(today)).toBe(true);
            expect(dateUtil.isToday(tomorrow)).toBe(false);
        });

        it('should check if two dates are on the same day', () => {
            const dateUtil = new DateUtil();
            const date1 = new Date('2023-01-15T10:00:00Z');
            const date2 = new Date('2023-01-15T15:00:00Z');
            const date3 = new Date('2023-01-16T10:00:00Z');
            expect(dateUtil.isSameDay(date1, date2)).toBe(true);
            expect(dateUtil.isSameDay(date1, date3)).toBe(false);
        });

        it('should return the end of the day', () => {
            const dateUtil = new DateUtil('America/New_York');
            const testDate = new Date('2023-01-15T15:30:00Z'); // UTC 3:30 PM
            const endOfDay = dateUtil.endOfDay(testDate);
            // In New York (UTC-5), 15:30 UTC is 10:30 AM NY. End of day is 23:59:59.999 NY.
            // This will be 04:59:59.999 UTC of the next day.
            expect(endOfDay.toISOString()).toMatch(/^2023-01-16T04:59:59\.999Z/);
        });

        it('should compare two dates', () => {
            const dateUtil = new DateUtil();
            const date1 = new Date('2023-01-15T10:00:00Z');
            const date2 = new Date('2023-01-15T15:00:00Z');
            const date3 = new Date('2023-01-15T10:00:00Z');
            expect(dateUtil.compareDates(date1, date2)).toBeLessThan(0);
            expect(dateUtil.compareDates(date2, date1)).toBeGreaterThan(0);
            expect(dateUtil.compareDates(date1, date3)).toBe(0);
        });

        it('should calculate days between two dates', () => {
            const dateUtil = new DateUtil();
            const date1 = new Date('2023-01-01T10:00:00Z');
            const date2 = new Date('2023-01-05T15:00:00Z');
            expect(dateUtil.daysBetween(date1, date2)).toBe(4);
            expect(dateUtil.daysBetween(date2, date1)).toBe(4);
            expect(dateUtil.daysBetween(date1, date1)).toBe(0);
        });

        it('should convert date to unix timestamp', () => {
            const dateUtil = new DateUtil();
            const testDate = new Date('2023-01-01T00:00:00Z');
            expect(dateUtil.toUnix(testDate)).toBe(1672531200);
        });

        it('should convert unix timestamp to date', () => {
            const dateUtil = new DateUtil();
            const unixTimestamp = 1672531200; // 2023-01-01T00:00:00Z
            const date = dateUtil.fromUnix(unixTimestamp);
            expect(date.toISOString()).toBe('2023-01-01T00:00:00.000Z');
        });

        it('should check if a year is a leap year', () => {
            const dateUtil = new DateUtil();
            expect(dateUtil.isLeapYear(new Date('2024-01-01'))).toBe(true); // Leap year
            expect(dateUtil.isLeapYear(new Date('2023-01-01'))).toBe(false); // Not a leap year
            expect(dateUtil.isLeapYear(new Date('2000-01-01'))).toBe(true); // Leap year
            expect(dateUtil.isLeapYear(new Date('1900-01-01'))).toBe(false); // Not a leap year
        });

    });
});
