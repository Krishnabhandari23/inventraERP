import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Mock inbox/notification data
export const getInboxItems = async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'unread', page = 1, limit = 20 } = req.query;

    const mockItems = [
      {
        id: 'INBOX-001',
        type: 'approval',
        title: 'Purchase Order #PO-2025-045 requires approval',
        message: 'John Doe has requested approval for a purchase order worth $15,000',
        priority: 'high',
        status: 'unread',
        createdAt: new Date('2025-01-22T10:30:00'),
        actionUrl: '/approvals/APV-001',
      },
      {
        id: 'INBOX-002',
        type: 'alert',
        title: 'Low stock alert: Component B',
        message: 'Component B stock level is below minimum threshold (25/100)',
        priority: 'medium',
        status: 'unread',
        createdAt: new Date('2025-01-22T09:15:00'),
        actionUrl: '/inventory/ITEM-002',
      },
      {
        id: 'INBOX-003',
        type: 'notification',
        title: 'Order #ORD-001 has been delivered',
        message: 'Order for Acme Corp has been successfully delivered',
        priority: 'low',
        status: 'read',
        createdAt: new Date('2025-01-21T16:45:00'),
        actionUrl: '/orders/ORD-001',
      },
    ];

    const filtered = status === 'all' 
      ? mockItems 
      : mockItems.filter(item => item.status === status);

    return res.json({
      success: true,
      data: filtered,
      count: {
        unread: mockItems.filter(i => i.status === 'unread').length,
        total: mockItems.length,
      },
    });
  } catch (error) {
    console.error('Get inbox items error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inbox items' });
  }
};

export const getInboxItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mockItem = {
      id,
      type: 'approval',
      title: 'Purchase Order #PO-2025-045 requires approval',
      message: 'John Doe has requested approval for a purchase order worth $15,000',
      details: {
        requestedBy: 'john.doe@example.com',
        amount: 15000.00,
        dueDate: new Date('2025-01-25'),
      },
      priority: 'high',
      status: 'unread',
      createdAt: new Date('2025-01-22T10:30:00'),
      actionUrl: '/approvals/APV-001',
    };

    return res.json({ success: true, data: mockItem });
  } catch (error) {
    console.error('Get inbox item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inbox item' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock marking as read
    return res.json({ 
      success: true, 
      message: 'Marked as read',
      data: { id, status: 'read' },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

export const archiveItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock archiving
    return res.json({ 
      success: true, 
      message: 'Item archived',
      data: { id, status: 'archived' },
    });
  } catch (error) {
    console.error('Archive item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to archive item' });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Mock deletion
    return res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};
