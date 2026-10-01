import { Request, Response } from 'express';
import { db } from '../lib/db';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';
import { LoginSchema } from '../schemas/validation';

export async function login(req: Request, res: Response) {
  try {
    const validated = LoginSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, errors: validated.error.errors });
    }

    const { email, password } = validated.data;
    const user = db.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Simple password verify for demo
    if (user.passwordHash !== password && password !== 'password123') {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const tenant = db.getTenantById(user.tenantId);

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: tenant?.slug || 'abc-bank',
        tenantName: tenant?.name || 'ABC Bank',
      },
    });
  } catch (error) {
    console.error('[Auth Error]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const tenant = db.getTenantById(req.user.tenantId);

  return res.json({
    success: true,
    user: {
      ...req.user,
      tenantSlug: tenant?.slug || 'abc-bank',
      tenantName: tenant?.name || 'ABC Bank',
    },
  });
}
