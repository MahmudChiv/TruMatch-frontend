import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

export async function POST() {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/users/me/github-sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: errorText || 'Failed to trigger github sync' },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error during github-sync proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
