import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const rawBody = await req.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    parsed = null;
  }

  const event = parsed?.event || 'incoming';
  const payload = parsed?.data ?? parsed ?? rawBody;

  await prisma.webhookLog.create({
    data: {
      source: 'inventra',
      event,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload)
    }
  });
  return NextResponse.json({ received: true });
}
