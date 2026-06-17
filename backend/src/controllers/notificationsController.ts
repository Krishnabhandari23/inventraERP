import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { createAuditLog } from '../utils/audit';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.query;

    if (!userId || !tenantId) {
      return res.status(400).json({ success: false, message: 'userId and tenantId are required' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: String(userId),
        tenantId: String(tenantId),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    await createAuditLog({
      tenantId: String(tenantId),
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'NOTIFICATION',
      entityId: id,
      meta: { marked: 'read' },
    });

    return res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.body;

    if (!userId || !tenantId) {
      return res.status(400).json({ success: false, message: 'userId and tenantId are required' });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        tenantId,
        isRead: false,
      },
      data: { isRead: true },
    });

    await createAuditLog({
      tenantId,
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'NOTIFICATION',
      entityId: 'bulk',
      meta: { markedCount: result.count },
    });

    return res.json({ success: true, markedCount: result.count });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, tenantId } = req.query;

    if (!userId || !tenantId) {
      return res.status(400).json({ success: false, message: 'userId and tenantId are required' });
    }

    const count = await prisma.notification.count({
      where: {
        userId: String(userId),
        tenantId: String(tenantId),
        isRead: false,
      },
    });

    return res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};
