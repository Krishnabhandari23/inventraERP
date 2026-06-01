import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'inventra_mock_session';
const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

type LoginPayload = {
  email?: string;
  password?: string;
  storeId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginPayload | null;

    const email = body?.email?.trim() ?? '';
    const password = body?.password?.trim() ?? '';
    const storeId = body?.storeId?.trim() ?? '';

    if (!email || !password || !storeId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, password, and Store ID are required.',
        },
        { status: 400 }
      );
    }

    // Call backend API for authentication
    const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, storeId }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Invalid credentials',
        },
        { status: backendResponse.status }
      );
    }

    // Set session cookie
    const tokenPayload = {
      user: data.user.email,
      userId: data.user.id,
      role: data.user.role,
      tenantId: data.user.tenantId,
      storeId,
    };

    const encoded = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful. Redirecting to dashboard…',
        user: data.user,
        token: data.token,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE,
      value: encoded,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Mock login failed', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Temporary login failed to start. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Helper re-exported for other routes that share the same cookie name.
export { SESSION_COOKIE };
