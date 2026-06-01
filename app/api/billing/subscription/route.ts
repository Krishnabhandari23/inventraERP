import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const subscription = await prisma.subscription.findFirst({
      orderBy: { id: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: {
          id: 'demo-subscription',
          tenantId: 'demo-tenant',
          plan: 'starter',
          status: 'trialing',
          stripeId: null,
          currentPeriodEnd: null,
        },
      });
    }

    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
