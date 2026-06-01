import { Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { createAuditLog } from '../utils/audit';

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, storeId } = req.body;

    // Optimize: Single query to fetch user with tenant in one go
    const user = await prisma.user.findFirst({
      where: { 
        email,
        tenant: {
          subdomain: storeId
        }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true
          }
        },
      },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = generateToken(user.id);

    // Fire and forget audit log (don't await - non-blocking)
    createAuditLog({
      tenantId: user.tenantId,
      actor: user.email,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
    }).catch(err => console.error('Audit log failed:', err));

    res.cookie('inventra_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name, storeId, role = 'worker' } = req.body;

    // Validate tenant by storeId (subdomain)
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: storeId },
    });

    if (!tenant) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Store ID' 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email,
        tenantId: tenant.id,
      },
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        tenantId: tenant.id,
      },
      include: { tenant: true },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      actor: user.email,
      action: 'REGISTER',
      entity: 'USER',
      entityId: user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now login.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await createAuditLog({
        tenantId: req.user.tenantId,
        actor: req.user.email,
        action: 'LOGOUT',
        entity: 'USER',
        entityId: req.user.id,
      });
    }

    res.clearCookie('inventra_token');

    return res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
};

export const getSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          subdomain: user.tenant.subdomain,
        },
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get session' 
    });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    const oldToken = req.cookies.inventra_token || req.headers.authorization?.replace('Bearer ', '');

    if (!oldToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Verify and decode old token
    const decoded = require('jsonwebtoken').verify(oldToken, process.env.JWT_SECRET!) as any;
    const newToken = generateToken(decoded.userId);

    res.cookie('inventra_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};
