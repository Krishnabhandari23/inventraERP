import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { createAuditLog } from '../utils/audit';
import { notifyApprovalResolved } from '../utils/notificationService';

export const getApprovals = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req;
    const { status, type } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID required' });
    }

    const whereClause: any = { tenantId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const approvals = await prisma.approval.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Get approvals error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch approvals' });
  }
};

export const getApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID required' });
    }

    const approval = await prisma.approval.findFirst({
      where: { id, tenantId },
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    return res.json({ success: true, data: approval });
  } catch (error) {
    console.error('Get approval error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch approval' });
  }
};

export const createApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { type, entityId, entityType, reviewerId, notes } = req.body;
    const { tenantId } = req;
    const actor = req.user!.email;

    if (!type || !entityId || !entityType) {
      return res.status(400).json({
        success: false,
        message: 'type, entityId, and entityType are required',
      });
    }

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID required' });
    }

    const approval = await prisma.approval.create({
      data: {
        tenantId,
        type,
        entityId,
        entityType,
        status: 'pending',
        requestedBy: actor,
        reviewedBy: reviewerId || null,
        notes: notes || null,
      },
    });

    await createAuditLog({
      tenantId,
      actor,
      action: 'CREATE',
      entity: 'APPROVAL',
      entityId: approval.id,
      meta: { type, entityType },
    });

    return res.status(201).json({
      success: true,
      message: 'Approval request created',
      data: approval,
    });
  } catch (error) {
    console.error('Create approval error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create approval request' });
  }
};

export const updateApprovalStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const { tenantId } = req;
    const actor = req.user!.email;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID required' });
    }

    const approval = await prisma.approval.findFirst({
      where: { id, tenantId },
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Approval not found' });
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status,
        reviewedBy: actor,
        notes: notes || approval.notes,
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      tenantId,
      actor,
      action: 'UPDATE',
      entity: 'APPROVAL',
      entityId: id,
      meta: { previousStatus: approval.status, newStatus: status },
    });

    // Notify requester if status is not pending
    if (status !== 'pending') {
      await notifyApprovalResolved(
        tenantId,
        approval.requestedBy,
        approval.entityType,
        approval.entityId,
        status as 'approved' | 'rejected',
        actor
      );
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update approval error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update approval' });
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
    const { tenantId } = req;
    console.log('[getMyPendingApprovals] Request data:', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      tenantId,
    });

    if (!tenantId) {
      console.error('[getMyPendingApprovals] Missing tenantId');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Fetch real pending approvals from database
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        tenantId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    console.log('[getMyPendingApprovals] Found approvals:', pendingApprovals.length);

    return res.json({
      success: true,
      data: pendingApprovals,
      count: pendingApprovals.length,
    });
  } catch (error) {
    console.error('[getMyPendingApprovals] Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending approvals',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
