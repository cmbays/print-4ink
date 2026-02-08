import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    // Get the access code from environment variables
    const validCode = process.env.DEMO_ACCESS_CODE || '4Ink-demo';

    if (code === validCode) {
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
    } else {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
