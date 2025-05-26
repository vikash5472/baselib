import { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface IJwtPayload extends JwtPayload {
  [key: string]: any;
}

export interface IJwtSignOptions extends SignOptions {}

export interface IJwtVerifyOptions extends VerifyOptions {}

export interface AuthenticatedRequest extends Request {
  user?: IJwtPayload;
}

export interface IJwtManager {
  setSecret(secret: string): void;
  sign(payload: object, options?: IJwtSignOptions): string;
  verify<T = any>(token: string, options?: IJwtVerifyOptions): T;
  decode(token: string): JwtPayload | null;
  extract(req: Request): string | null;
  authMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
}
