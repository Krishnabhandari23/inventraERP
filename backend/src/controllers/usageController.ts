import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { any } from 'zod';

export const trackUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { kind, amount } = req.body;

    if (!kind || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kind and amount are required' 
      });
    }

    const usageEvent = await prisma.usageEvent.create({
      data: {
        tenantId: req.tenantId!,
        kind,
        amount: Number(amount),
      },
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Usage tracked', 
      data: usageEvent 
    });
  } catch (error) {
    console.error('Track usage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to track usage' });
  }
};

export const getUsageReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, kind } = req.query;

    const where: any = {
      tenantId: req.tenantId!,
    };

    if (kind) where.kind = kind;
    if (startDate || endDate) {
      where.at = {};
      if (startDate) where.at.gte = new Date(startDate as string);
      if (endDate) where.at.lte = new Date(endDate as string);
    }

    const usageEvents = await prisma.usageEvent.findMany({
      where,
      orderBy: { at: 'desc' },
    });

    // Aggregate by kind
    const aggregated: Record<string, { count: number; total: number }> = {};
    usageEvents.forEach((event: any) => {
      if (!aggregated[event.kind]) {
        aggregated[event.kind] = { count: 0, total: 0 };
      }
      aggregated[event.kind].count += 1;
      aggregated[event.kind].total += event.amount;
    });

    return res.json({
      success: true,
      data: {
        events: usageEvents,
        summary: aggregated,
        totalEvents: usageEvents.length,
      },
    });
  } catch (error) {
    console.error('Get usage report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch usage report' });
  }
};
