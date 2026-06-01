import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type } = req.query;

    const mockApprovals = [
      {
        id: 'APV-001',
        type: 'purchase_order',
        title: 'Purchase Order #PO-2025-045',
        requestedBy: 'john.doe@example.com',
        amount: 15000.00,
        status: 'pending',
        priority: 'high',
        requestDate: new Date('2025-01-18'),
        dueDate: new Date('2025-01-22'),
        description: 'Raw materials for Q1 production',
        tenantId: req.tenantId,
      },
      {
        id: 'APV-002',
        type: 'expense',
        title: 'Marketing Campaign Budget',
        requestedBy: 'jane.smith@example.com',
        amount: 8500.00,
        status: 'pending',
        priority: 'medium',
        requestDate: new Date('2025-01-19'),
        dueDate: new Date('2025-01-25'),
        description: 'Q1 digital marketing campaign',
        tenantId: req.tenantId,
      },
      {
        id: 'APV-003',
        type: 'invoice',
        title: 'Vendor Invoice #VIN-2025-123',
        requestedBy: 'bob.wilson@example.com',
        amount: 3200.00,
        status: 'approved',
        priority: 'low',
        requestDate: new Date('2025-01-15'),
        approvedDate: new Date('2025-01-16'),
        approvedBy: req.user!.email,
        description: 'Monthly maintenance services',
        tenantId: req.tenantId,
      },
    ];

    let filteredApprovals = mockApprovals;
    if (status) {
      filteredApprovals = filteredApprovals.filter(a => a.status === status);
    }
    if (type) {
      filteredApprovals = filteredApprovals.filter(a => a.type === type);
    }

    return res.json({ success: true, data: filteredApprovals });
  } catch (error) {
    console.error('Get approvals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch approvals' });
  }
};

export const getApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const mockApproval = {
      id,
      type: 'purchase_order',
      title: 'Purchase Order #PO-2025-045',
      requestedBy: {
        id: 'USER-001',
        email: 'john.doe@example.com',
        name: 'John Doe',
      },
      amount: 15000.00,
      status: 'pending',
      priority: 'high',
      requestDate: new Date('2025-01-18'),
      dueDate: new Date('2025-01-22'),
      description: 'Raw materials for Q1 production',
      attachments: [
        { id: '1', name: 'quote.pdf', url: '/files/quote.pdf' },
      ],
      approvalChain: [
        { role: 'manager', approver: 'manager@example.com', status: 'approved', date: new Date('2025-01-18') },
        { role: 'finance', approver: req.user!.email, status: 'pending', date: null },
      ],
      comments: [
        { author: 'John Doe', text: 'Urgent - needed for production start', date: new Date('2025-01-18') },
      ],
      tenantId: req.tenantId,
    };

    return res.json({ success: true, data: mockApproval });
  } catch (error) {
    console.error('Get approval error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch approval' });
  }
};

export const createApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, amount, description, priority, dueDate, attachments } = req.body;

    if (!type || !title || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type, title, and amount are required' 
      });
    }

    const newApproval = {
      id: `APV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      type,
      title,
      requestedBy: req.user!.email,
      amount,
      description,
      priority: priority || 'medium',
      status: 'pending',
      requestDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      attachments,
      tenantId: req.tenantId,
      createdAt: new Date(),
    };

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'CREATE',
      entity: 'APPROVAL',
      entityId: newApproval.id,
      meta: { type, title, amount },
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Approval request created', 
      data: newApproval 
    });
  } catch (error) {
    console.error('Create approval error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create approval request' });
  }
};

export const approveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'APPROVE',
      entity: 'APPROVAL',
      entityId: id,
      meta: { comments },
    });

    return res.json({ 
      success: true, 
      message: 'Request approved',
      data: {
        id,
        status: 'approved',
        approvedBy: req.user!.email,
        approvedDate: new Date(),
      },
    });
  } catch (error) {
    console.error('Approve request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve request' });
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    await createAuditLog({
      tenantId: req.tenantId!,
      actor: req.user!.email,
      action: 'REJECT',
      entity: 'APPROVAL',
      entityId: id,
      meta: { reason },
    });

    return res.json({ 
      success: true, 
      message: 'Request rejected',
      data: {
        id,
        status: 'rejected',
        rejectedBy: req.user!.email,
        rejectedDate: new Date(),
        reason,
      },
    });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject request' });
  }
};

export const getMyPendingApprovals = async (req: AuthRequest, res: Response) => {
  try {
    // Mock pending approvals for the current user's role
    const mockPendingApprovals = [
      {
        id: 'APV-001',
        type: 'purchase_order',
        title: 'Purchase Order #PO-2025-045',
        requestedBy: 'john.doe@example.com',
        amount: 15000.00,
        priority: 'high',
        requestDate: new Date('2025-01-18'),
        dueDate: new Date('2025-01-22'),
      },
      {
        id: 'APV-002',
        type: 'expense',
        title: 'Marketing Campaign Budget',
        requestedBy: 'jane.smith@example.com',
        amount: 8500.00,
        priority: 'medium',
        requestDate: new Date('2025-01-19'),
        dueDate: new Date('2025-01-25'),
      },
    ];

    return res.json({ 
      success: true, 
      data: mockPendingApprovals,
      count: mockPendingApprovals.length,
    });
  } catch (error) {
    console.error('Get my pending approvals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending approvals' });
  }
};
