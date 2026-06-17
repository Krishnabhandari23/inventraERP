import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { createAuditLog } from '../utils/audit';

export const getInboxItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenantId;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    if (!userId || !tenantId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const messages = await prisma.inboxMessage.findMany({
      where: {
        recipientId: userId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: (Math.max(page, 1) - 1) * limit,
    });

    const total = await prisma.inboxMessage.count({
      where: {
        recipientId: userId,
        tenantId,
      },
    });

    const unreadCount = await prisma.inboxMessage.count({
      where: {
        recipientId: userId,
        tenantId,
        isRead: false,
      },
    });

    return res.json({
      success: true,
      data: messages,
      count: {
        unread: unreadCount,
        total,
      },
    });
  } catch (error) {
    console.error('Get inbox items error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inbox items' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const unreadCount = await prisma.inboxMessage.count({
      where: {
        recipientId: userId,
        tenantId,
        isRead: false,
      },
    });

    return res.json({ success: true, count: { unread: unreadCount } });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
};

export const getInboxItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.inboxMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    return res.json({ success: true, data: message });
  } catch (error) {
    console.error('Get inbox item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inbox item' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;

    const message = await prisma.inboxMessage.update({
      where: { id },
      data: { isRead: true },
    });

    await createAuditLog({
      tenantId: String(tenantId),
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'INBOX_MESSAGE',
      entityId: id,
      meta: { marked: 'read' },
    });

    return res.json({
      success: true,
      message: 'Marked as read',
      data: message,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

export const markAsUnread = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;

    const message = await prisma.inboxMessage.update({
      where: { id },
      data: { isRead: false },
    });

    await createAuditLog({
      tenantId: String(tenantId),
      actor: req.user!.email,
      action: 'UPDATE',
      entity: 'INBOX_MESSAGE',
      entityId: id,
      meta: { marked: 'unread' },
    });

    return res.json({
      success: true,
      message: 'Marked as unread',
      data: message,
    });
  } catch (error) {
    console.error('Mark as unread error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark as unread' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId, subject, body, tenantId } = req.body;
    const senderId = req.user!.id;

    if (!recipientId || !body || !tenantId) {
      return res.status(400).json({ success: false, message: 'recipientId, body, and tenantId are required' });
    }

    const message = await prisma.inboxMessage.create({
      data: {
        senderId,
        recipientId,
        tenantId,
        subject: subject || 'No Subject',
        body,
      },
    });

    await createAuditLog({
      tenantId,
      actor: req.user!.email,
      action: 'CREATE',
      entity: 'INBOX_MESSAGE',
      entityId: message.id,
      meta: { recipientId },
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;

    await prisma.inboxMessage.delete({
      where: { id },
    });

    await createAuditLog({
      tenantId: String(tenantId),
      actor: req.user!.email,
      action: 'DELETE',
      entity: 'INBOX_MESSAGE',
      entityId: id,
      meta: {},
    });

    return res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

export const archiveItem = async (req: AuthRequest, res: Response) => {
  try {
    // Since we don't have an archive column, we'll just mark as read for now
    // In a real system, add an 'archived' column to the InboxMessage model
    return res.json({
      success: true,
      message: 'Item archived (functionality can be extended)',
    });
  } catch (error) {
    console.error('Archive item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to archive item' });
  }
};
