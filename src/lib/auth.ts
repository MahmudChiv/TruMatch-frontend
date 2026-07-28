import { cookies } from 'next/headers';
import { UserProfile } from './api/types';

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('trumatch_token')?.value;
  return token || null;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const res = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const user: UserProfile = await res.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}
