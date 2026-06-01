import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      actor, 
      action, 
      entity, 
      startDate, 
      endDate 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.tenantId!,
    };

    if (actor) where.actor = actor;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.at = {};
      if (startDate) where.at.gte = new Date(startDate as string);
      if (endDate) where.at.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        orderBy: { at: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.audit.count({ where }),
    ]);

    return res.json({
      success: true,
      data: logs.map((log: any) => ({
        ...log,
        meta: log.meta ? JSON.parse(log.meta) : null,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

export const getAuditLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const log = await prisma.audit.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    return res.json({
      success: true,
      data: {
        ...log,
        meta: (log as any).meta ? JSON.parse((log as any).meta) : null,
      },
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
  }
};

export const getEntityAuditTrail = async (req: AuthRequest, res: Response) => {
  try {
    const { entityId } = req.params;
    const { entity } = req.query;

    const where: any = {
      tenantId: req.tenantId!,
      entityId,
    };

    if (entity) {
      where.entity = entity;
    }

    const logs = await prisma.audit.findMany({
      where,
      orderBy: { at: 'desc' },
    });

    return res.json({
      success: true,
      data: logs.map((log: any) => ({
        ...log,
        meta: log.meta ? JSON.parse(log.meta) : null,
      })),
      count: logs.length,
    });
  } catch (error) {
    console.error('Get entity audit trail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch entity audit trail' });
  }
};
