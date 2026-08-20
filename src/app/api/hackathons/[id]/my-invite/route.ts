import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const res = await fetch(`${backendUrl}/hackathons/${id}/my-invite`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: errorText || 'Failed to fetch pending invite' },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching my pending invite proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
