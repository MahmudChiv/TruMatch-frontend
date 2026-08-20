import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth';

export async function PATCH(
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

    const res = await fetch(`${backendUrl}/users/me/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: errorText || 'Failed to mark notification read' },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error marking notification read proxy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
