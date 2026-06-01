import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get('kind') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (kind) where.kind = kind;

    if (startDate || endDate) {
      where.at = {};
      if (startDate) where.at.gte = new Date(startDate);
      if (endDate) where.at.lte = new Date(endDate);
    }

    const events = await prisma.usageEvent.findMany({
      where,
      orderBy: { at: 'desc' },
    });

    const summary: Record<string, { count: number; total: number }> = {};
    for (const event of events) {
      if (!summary[event.kind]) {
        summary[event.kind] = { count: 0, total: 0 };
      }
      summary[event.kind].count += 1;
      summary[event.kind].total += event.amount;
    }

    return NextResponse.json({
      success: true,
      data: {
        events,
        summary,
        totalEvents: events.length,
      },
    });
  } catch (error) {
    console.error('Get usage report error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch usage report' },
      { status: 500 }
    );
  }
}
