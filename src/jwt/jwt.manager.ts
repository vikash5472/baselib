import jwt, { TokenExpiredError, JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { IJwtManager, IJwtPayload, IJwtSignOptions, IJwtVerifyOptions, AuthenticatedRequest } from './types';
import { config } from '../config';
import { AppError, ErrorType } from '../errors';

export class JwtManager implements IJwtManager {
  private _secret: string | null = null;

  constructor() {
    // Attempt to load secret from config if not already set
    try {
      const configuredSecret = config.getOptional('JWT_SECRET');
      if (configuredSecret) {
        this._secret = configuredSecret;
      }
    } catch (e) {
      // Ignore if config is not yet initialized or secret is missing
    }
  }

  public setSecret(secret: string): void {
    this._secret = secret;
  }

  private getSecretOrThrow(): string {
    if (!this._secret) {
      throw new AppError('JWT secret is not set. Call jwt.setSecret() or set JWT_SECRET environment variable.', 500, ErrorType.INTERNAL);
    }
    return this._secret;
  }

  /**
   * Signs a JWT token.
   * @param payload The payload to sign.
   * @param options Optional signing options.
   * @returns The signed JWT token.
   */
  public sign(payload: object, options?: IJwtSignOptions): string {
    const jwtSecret = this.getSecretOrThrow();
    return jwt.sign(payload, jwtSecret, options);
  }

  /**
   * Verifies a JWT token.
   * @param token The JWT token to verify.
   * @param options Optional verification options.
   * @returns The decoded JWT payload.
   * @throws AppError if the token is invalid or secret is missing.
   */
  public verify<T = any>(token: string, options?: IJwtVerifyOptions): T {
    const jwtSecret = this.getSecretOrThrow();
    try {
      return jwt.verify(token, jwtSecret, options) as T;
    } catch (error: any) {
      if (error instanceof TokenExpiredError) {
        throw new AppError('JWT token expired', 401, ErrorType.AUTH, { originalError: error });
      }
      if (error instanceof JsonWebTokenError) {
        throw new AppError('Invalid JWT token', 401, ErrorType.AUTH, { originalError: error });
      }
      throw new AppError('JWT verification failed', 500, ErrorType.INTERNAL, { originalError: error });
    }
  }

  /**
   * Decodes a JWT token without verifying its signature.
   * @param token The JWT token to decode.
   * @returns The decoded JWT payload or null if decoding fails.
   */
  public decode(token: string): IJwtPayload | null {
    const decoded = jwt.decode(token);
    if (typeof decoded === 'string') {
      return null;
    }
    return decoded as IJwtPayload | null;
  }

  /**
   * Extracts the Bearer token from the Authorization header of an Express request.
   * @param req The Express request object.
   * @returns The extracted token string or null if not found.
   */
  public extract(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * Express middleware for JWT authentication.
   * Extracts, verifies, and attaches the user payload to the request.
   * Throws AppError (401) if token is missing, invalid, or expired.
   * @returns Express middleware function.
   */
  public authMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const token = this.extract(req);

      if (!token) {
        return next(new AppError('Authorization token missing', 401, ErrorType.AUTH));
      }

      try {
        const decoded = this.verify<IJwtPayload>(token);
        req.user = decoded;
        next();
      } catch (error: any) {
        next(error);
      }
    };
  }
}
