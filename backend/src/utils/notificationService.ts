import prisma from '../config/database';

export async function createNotification({
  userId,
  tenantId,
  title,
  message,
  type = 'info',
  entityId,
  entityType,
}: {
  userId: string;
  tenantId: string;
  title: string;
  message: string;
  type?: 'info' | 'approval' | 'payment' | 'alert';
  entityId?: string;
  entityType?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        tenantId,
        title,
        message,
        type,
        entityId,
        entityType,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifyApprovalCreated(
  tenantId: string,
  reviewerId: string,
  entityType: string,
  entityId: string,
  approvalType: string
) {
  await createNotification({
    userId: reviewerId,
    tenantId,
    title: `New ${approvalType.replace(/_/g, ' ')} requires approval`,
    message: `A ${approvalType.replace(/_/g, ' ')} has been submitted and awaits your review.`,
    type: 'approval',
    entityId,
    entityType,
  });
}

export async function notifyApprovalResolved(
  tenantId: string,
  requesterId: string,
  entityType: string,
  entityId: string,
  status: 'approved' | 'rejected',
  reviewerName?: string
) {
  await createNotification({
    userId: requesterId,
    tenantId,
    title: `Your ${entityType.replace(/_/g, ' ')} was ${status}`,
    message: `Your request has been ${status}${reviewerName ? ` by ${reviewerName}` : ''}.`,
    type: 'approval',
    entityId,
    entityType,
  });
}

export async function notifyPaymentCompleted(
  tenantId: string,
  userId: string,
  amount: number,
  entityType?: string
) {
  await createNotification({
    userId,
    tenantId,
    title: 'Payment received',
    message: `Payment of ₹${amount.toFixed(2)} has been successfully processed.`,
    type: 'payment',
    entityType,
  });
}
