import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Demo-friendly portal fallback.
    const url = 'https://billing.example.com/portal/session-demo';
    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
