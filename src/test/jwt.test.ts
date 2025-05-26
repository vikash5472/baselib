import { jwt, AuthenticatedRequest, IJwtPayload } from '../jwt';
import { AppError, ErrorType } from '../errors';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Mock config.getOptional to control JWT_SECRET for tests
jest.mock('../config', () => ({
  config: {
    getOptional: jest.fn(),
  },
}));

describe('JwtManager', () => {
  const TEST_SECRET = 'supersecretjwtkey';
  const TEST_PAYLOAD = { userId: '123', username: 'testuser' };
  let mockConfigGetOptional: jest.Mock;

  beforeAll(() => {
    // Ensure the singleton is clean for each test run
    // This is important because `jwt` is a global singleton
    jwt.setSecret(TEST_SECRET);
  });

  beforeEach(() => {
    mockConfigGetOptional = config.getOptional as jest.Mock;
    mockConfigGetOptional.mockClear();
    mockConfigGetOptional.mockReturnValue(TEST_SECRET); // Default mock for config
  });

  afterEach(() => {
    // Reset secret to null or a default after each test if needed,
    // but for a singleton, setting it in beforeAll is usually sufficient
    // if tests don't modify it in a way that breaks others.
    // For this test suite, we ensure it's always TEST_SECRET.
  });

  describe('setSecret', () => {
    it('should set the JWT secret', () => {
      const newSecret = 'newtestsecret';
      jwt.setSecret(newSecret);
      // To verify, we'd need a way to read the internal secret,
      // but for now, we rely on sign/verify using it correctly.
      // A more robust test might involve a test-only getter.
      const token = jwt.sign(TEST_PAYLOAD);
      const decoded = jwt.verify(token);
      expect(decoded).toMatchObject(TEST_PAYLOAD);
    });
  });

  describe('sign', () => {
    it('should sign a token with the set secret', () => {
      const token = jwt.sign(TEST_PAYLOAD);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should sign a token with custom options', () => {
      const token = jwt.sign(TEST_PAYLOAD, { expiresIn: '1h' });
      const decoded = jwt.decode(token);
      expect(decoded).toHaveProperty('exp');
      expect(decoded!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should throw AppError if secret is not set', () => {
      jwt.setSecret(null as any); // Temporarily unset the secret
      expect(() => jwt.sign(TEST_PAYLOAD)).toThrow(AppError);
      expect(() => jwt.sign(TEST_PAYLOAD)).toThrow('JWT secret is not set');
      jwt.setSecret(TEST_SECRET); // Reset for other tests
    });
  });

  describe('verify', () => {
    it('should verify a valid token', () => {
      const token = jwt.sign(TEST_PAYLOAD);
      const decoded = jwt.verify(token);
      expect(decoded).toMatchObject(TEST_PAYLOAD);
    });

    it('should throw AppError for an expired token', async () => {
      const expiredToken = jwt.sign(TEST_PAYLOAD, { expiresIn: '0s' });
      // Wait for the token to actually expire
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        jwt.verify(expiredToken);
        // If it reaches here, the test should fail as an error was expected
        fail('Expected AppError to be thrown for expired token');
      } catch (e: any) {
        expect(e).toBeInstanceOf(AppError);
        expect(e.message).toBe('JWT token expired');
        expect(e.statusCode).toBe(401);
        expect(e.type).toBe(ErrorType.AUTH);
      }
    });

    it('should throw AppError for an invalid token', () => {
      const invalidToken = 'invalid.jwt.token';
      try {
        jwt.verify(invalidToken);
      } catch (e: any) {
        expect(e).toBeInstanceOf(AppError);
        expect(e.message).toBe('Invalid JWT token');
        expect(e.statusCode).toBe(401);
        expect(e.type).toBe(ErrorType.AUTH);
      }
    });

    it('should throw AppError if secret is not set', () => {
      jwt.setSecret(null as any); // Temporarily unset the secret
      expect(() => jwt.verify('some.token.here')).toThrow(AppError);
      expect(() => jwt.verify('some.token.here')).toThrow('JWT secret is not set');
      jwt.setSecret(TEST_SECRET); // Reset for other tests
    });
  });

  describe('decode', () => {
    it('should decode a token without verification', () => {
      const token = jwt.sign(TEST_PAYLOAD);
      const decoded = jwt.decode(token);
      expect(decoded).toMatchObject(TEST_PAYLOAD);
      expect(decoded).toHaveProperty('iat');
    });

    it('should return null for an invalid token format', () => {
      const decoded = jwt.decode('invalid-token-format');
      expect(decoded).toBeNull();
    });
  });

  describe('extract', () => {
    it('should extract token from Authorization header', () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer my.test.token',
        },
      } as Request;
      expect(jwt.extract(mockReq)).toBe('my.test.token');
    });

    it('should return null if Authorization header is missing', () => {
      const mockReq = { headers: {} } as Request;
      expect(jwt.extract(mockReq)).toBeNull();
    });

    it('should return null if Authorization header is not Bearer', () => {
      const mockReq = {
        headers: {
          authorization: 'Basic abcdef',
        },
      } as Request;
      expect(jwt.extract(mockReq)).toBeNull();
    });
  });

  describe('authMiddleware', () => {
    let mockReq: Partial<AuthenticatedRequest>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
      mockReq = { headers: {} };
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should call next() with no arguments for a valid token', () => {
      const token = jwt.sign(TEST_PAYLOAD);
      mockReq.headers!.authorization = `Bearer ${token}`;

      jwt.authMiddleware()(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toMatchObject(TEST_PAYLOAD);
    });

    it('should call next() with AppError if token is missing', () => {
      jwt.authMiddleware()(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Authorization token missing');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe(ErrorType.AUTH);
    });

    it('should call next() with AppError if token is invalid', () => {
      mockReq.headers!.authorization = 'Bearer invalid.token.here';

      jwt.authMiddleware()(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid JWT token');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe(ErrorType.AUTH);
    });

    it('should call next() with AppError if token is expired', async () => {
      const expiredToken = jwt.sign(TEST_PAYLOAD, { expiresIn: '0s' });
      await new Promise(resolve => setTimeout(resolve, 100)); // Ensure token expires
      mockReq.headers!.authorization = `Bearer ${expiredToken}`;

      jwt.authMiddleware()(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('JWT token expired');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe(ErrorType.AUTH);
    });
  });
});
