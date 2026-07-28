import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    // 1. Exchange the one-time code for a JWT
    const res = await fetch(`${backendUrl}/auth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to exchange authorization code:', res.statusText);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    const data = await res.json();
    const token = data.accessToken;
    const userId = data.user?.id;

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }

    // 2. Set the httpOnly auth cookie
    const cookieStore = await cookies();
    cookieStore.set('trumatch_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // 3. Fire-and-forget: enqueue the GitHub sync job
    //    We don't await this — the WebSocket on /preparing will be notified when done
    fetch(`${backendUrl}/users/me/github-sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }).catch((err) =>
      console.error('[github-sync] Failed to enqueue sync job:', err),
    );

    // 4. Redirect to the cinematic preparing page (not dashboard)
    const prepUrl = new URL('/preparing', request.url);
    if (userId) prepUrl.searchParams.set('uid', userId);
    return NextResponse.redirect(prepUrl);
  } catch (error) {
    console.error('Error during OAuth exchange:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
