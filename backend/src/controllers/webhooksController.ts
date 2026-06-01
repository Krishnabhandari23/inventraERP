import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { createHmac, timingSafeEqual } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const safeCompare = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
};

const extractTenantIdFromAuth = async (req: Request): Promise<string | undefined> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return undefined;

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return undefined;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: string };
    if (!decoded.userId) return undefined;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tenantId: true },
    });

    return user?.tenantId;
  } catch {
    return undefined;
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ success: false, message: 'Missing signature' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const eventObject = event.data.object as { metadata?: Record<string, string | undefined> };
    const tenantId = eventObject.metadata?.tenantId;

    // Log webhook event
    await prisma.webhookLog.create({
      data: {
        tenantId,
        source: 'stripe',
        event: event.type,
        payload: JSON.stringify(event.data.object),
      },
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        console.log('Checkout completed:', event.data.object);
        break;
      
      case 'customer.subscription.updated':
        // Handle subscription update
        console.log('Subscription updated:', event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        console.log('Subscription cancelled:', event.data.object);
        break;
      
      case 'invoice.paid':
        // Handle successful payment
        console.log('Invoice paid:', event.data.object);
        break;
      
      case 'invoice.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

export const handleInventraWebhook = async (req: Request, res: Response) => {
  try {
    const { event, data, signature } = req.body;

    const tenantIdFromAuth = await extractTenantIdFromAuth(req);
    const tenantIdFromBody = typeof req.body?.tenantId === 'string' ? req.body.tenantId : undefined;
    const tenantIdFromData = typeof data?.tenantId === 'string' ? data.tenantId : undefined;
    const tenantId = tenantIdFromAuth || tenantIdFromBody || tenantIdFromData;

    const webhookSecret = process.env.INVENTRA_WEBHOOK_SECRET;
    if (webhookSecret) {
      const incomingSig = (req.headers['x-inventra-signature'] as string | undefined) || signature;
      if (!incomingSig) {
        return res.status(400).json({ success: false, message: 'Missing webhook signature' });
      }

      const digest = createHmac('sha256', webhookSecret)
        .update(JSON.stringify({ event, data }))
        .digest('hex');

      if (!safeCompare(String(incomingSig), digest)) {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      }
    } else if (!tenantIdFromAuth) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized webhook source. Configure INVENTRA_WEBHOOK_SECRET or send a valid Bearer token.',
      });
    }

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Missing tenant context' });
    }

    // Log webhook event
    await prisma.webhookLog.create({
      data: {
        tenantId,
        source: 'inventra',
        event: event,
        payload: JSON.stringify(data),
      },
    });

    // Process webhook based on event type
    switch (event) {
      case 'inventory.updated':
        console.log('Inventory updated:', data);
        break;
      
      case 'order.created':
        console.log('Order created:', data);
        break;
      
      default:
        console.log(`Unhandled Inventra event: ${event}`);
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Inventra webhook error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

export const getWebhooks = async (req: AuthRequest, res: Response) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: webhooks });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch webhooks' });
  }
};

export const registerWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, secret } = req.body;

    if (!name || !url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and URL are required' 
      });
    }

    const webhook = await prisma.webhook.create({
      data: {
        tenantId: req.tenantId!,
        name,
        url,
        secret: secret || Math.random().toString(36).substr(2),
        enabled: true,
      },
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Webhook registered', 
      data: webhook 
    });
  } catch (error) {
    console.error('Register webhook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to register webhook' });
  }
};

export const updateWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, enabled } = req.body;

    const webhook = await prisma.webhook.update({
      where: { 
        id,
        tenantId: req.tenantId!,
      },
      data: { name, url, enabled },
    });

    return res.json({ success: true, message: 'Webhook updated', data: webhook });
  } catch (error) {
    console.error('Update webhook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update webhook' });
  }
};

export const deleteWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.webhook.delete({
      where: { 
        id,
        tenantId: req.tenantId!,
      },
    });

    return res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete webhook' });
  }
};

export const getWebhookLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, source, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      tenantId: req.tenantId!,
    };
    if (source) {
      where.source = source;
    }
    if (search) {
      where.OR = [
        { event: { contains: String(search) } },
        { payload: { contains: String(search) } },
      ];
    }

    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip,
    });

    const total = await prisma.webhookLog.count({ where });

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get webhook logs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch webhook logs' });
  }
};
