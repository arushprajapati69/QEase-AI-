import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qease_ai_jwt_secret_dev_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
    name: string;
  };
}

export function authenticateStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Default demo staff fallback for testing convenience
    req.user = {
      userId: 'u2222222-2222-4222-a222-222222222222',
      tenantId: '11111111-1111-4111-a111-111111111111', // ABC Bank
      role: 'TELLER',
      email: 'teller1@abcbank.com',
      name: 'David Miller (Counter 1)',
    };
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

export function generateToken(payload: { userId: string; tenantId: string; role: string; email: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}
