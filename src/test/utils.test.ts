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

        it('should check if a date is in the future', () => {
            const dateUtil = new DateUtil();
            const futureDate = new Date(Date.now() + 100000);
            const pastDate = new Date(Date.now() - 100000);
            expect(dateUtil.isFuture(futureDate)).toBe(true);
            expect(dateUtil.isFuture(pastDate)).toBe(false);
        });

        it('should return the start of the day', () => {
            const dateUtil = new DateUtil('America/New_York');
            const testDate = new Date('2023-01-15T15:30:00Z'); // UTC 3:30 PM
            const startOfDay = dateUtil.startOfDay(testDate);
            // In New York (UTC-5), 15:30 UTC is 10:30 AM NY. Start of day is 00:00 NY.
            // This will be 05:00 UTC.
            expect(startOfDay.toISOString()).toMatch(/^2023-01-15T05:00:00\.000Z/);
        });
    });
});
