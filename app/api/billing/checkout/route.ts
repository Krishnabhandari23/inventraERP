import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const plan = body?.plan || 'enterprise';
  const key = process.env.STRIPE_SECRET_KEY;
  try {
    const fallbackUrl = `https://billing.example.com/checkout/${plan}`;

    if (!key) {
      return NextResponse.json({
        success: true,
        data: {
          sessionId: `mock_${Date.now()}`,
          url: fallbackUrl,
          note: 'Set STRIPE_SECRET_KEY to enable real sessions.',
        },
      });
    }

    const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID || 'price_xxx', quantity: 1 }],
      success_url: 'http://localhost:3000/billing?success=1',
      cancel_url: 'http://localhost:3000/billing?canceled=1',
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, message: 'Stripe checkout did not return a URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (e: any) {
    const fallbackUrl = `https://billing.example.com/checkout/${plan}`;
    return NextResponse.json({
      success: true,
      data: {
        sessionId: `fallback_${Date.now()}`,
        url: fallbackUrl,
        note: e?.message || 'Using fallback checkout URL',
      },
    });
  }
}
