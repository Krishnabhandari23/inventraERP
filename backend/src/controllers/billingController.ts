import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import Stripe from 'stripe';
import { any } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const getSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: req.tenantId! },
      orderBy: { id: 'desc' },
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          plan: 'starter',
          status: 'trialing',
          message: 'No active subscription',
        },
      });
    }

    return res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { plan, returnUrl } = req.body;

    if (!plan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan is required' 
      });
    }

    // Mock Stripe checkout session
    const mockSession = {
      id: 'cs_test_' + Math.random().toString(36).substr(2),
      url: `https://checkout.stripe.com/mock/${plan}`,
    };

    // In production, create actual Stripe session:
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   success_url: returnUrl || `${process.env.CORS_ORIGIN}/billing/success`,
    //   cancel_url: `${process.env.CORS_ORIGIN}/billing`,
    // });

    return res.json({ 
      success: true, 
      data: { 
        sessionId: mockSession.id,
        url: mockSession.url,
      },
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};

export const createPortalSession = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: req.tenantId! },
    });

    // Demo-safe behavior: always provide a working URL even before a Stripe customer exists.
    const mockPortal = {
      url: subscription?.stripeId
        ? 'https://billing.stripe.com/portal/mock'
        : `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/billing?portal=unavailable`,
    };

    // In production, create actual portal session:
    // const portalSession = await stripe.billingPortal.sessions.create({
    //   customer: subscription.stripeId,
    //   return_url: `${process.env.CORS_ORIGIN}/billing`,
    // });

    return res.json({
      success: true,
      data: {
        url: mockPortal.url,
      },
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create portal session' });
  }
};

export const getUsageMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const usageEvents = await prisma.usageEvent.findMany({
      where: {
        tenantId: req.tenantId!,
        at: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      orderBy: { at: 'desc' },
    });

    // Aggregate by kind
    const aggregated: Record<string, number> = {};
    usageEvents.forEach((event: any) => {
      if (!aggregated[event.kind]) {
        aggregated[event.kind] = 0;
      }
      aggregated[event.kind] += event.amount;
    });

    return res.json({
      success: true,
      data: {
        events: usageEvents,
        summary: aggregated,
        total: usageEvents.length,
      },
    });
  } catch (error) {
    console.error('Get usage metrics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch usage metrics' });
  }
};

export const upgradePlan = async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;

    const validPlans = ['starter', 'growth', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan' 
      });
    }

    // Update subscription in database
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: req.tenantId! },
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'No subscription found' 
      });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { plan },
    });

    return res.json({ 
      success: true, 
      message: 'Plan upgraded successfully', 
      data: updated 
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upgrade plan' });
  }
};
