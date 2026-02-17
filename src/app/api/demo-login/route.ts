import { NextRequest, NextResponse } from 'next/server';
import { demoLoginSchema } from '@domain/entities/demo-login';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod schema
    const validationResult = demoLoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { code } = validationResult.data;

    // Get the access code from environment variables
    // In production, require the env var to be set (fail-closed)
    const validCode = process.env.DEMO_ACCESS_CODE;
    if (!validCode && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Fall back to default only in development
    const expectedCode = validCode || '4Ink-demo';

    if (code === expectedCode) {
      // Set a secure cookie that expires in 30 days
      const response = NextResponse.json({ success: true });
      response.cookies.set('demo-access', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { error: 'Invalid access code' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
