import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/admin/check`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ admin: false }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking admin proxy:', error);
    return NextResponse.json({ admin: false }, { status: 500 });
  }
}
