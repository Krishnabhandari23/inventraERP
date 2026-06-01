import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

type RegisterPayload = {
  email?: string;
  password?: string;
  name?: string;
  storeId?: string;
  role?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload | null;

    const email = body?.email?.trim() ?? '';
    const password = body?.password?.trim() ?? '';
    const name = body?.name?.trim() ?? '';
    const storeId = body?.storeId?.trim() ?? '';
    const role = body?.role?.trim() || 'worker';

    if (!email || !password || !name || !storeId) {
      return NextResponse.json(
        {
          success: false,
          message: 'All fields are required.',
        },
        { status: 400 }
      );
    }

    // Call backend API for registration
    const backendResponse = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, storeId, role }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Registration failed',
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: data.message || 'Registration successful. Please login.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Registration failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
