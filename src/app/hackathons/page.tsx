import { redirect } from 'next/navigation';
import { getCurrentUser, getSessionToken } from '@/lib/auth';
import type { HackathonSummary } from '@/lib/api/types';
import HackathonsShell from '@/components/hackathons/HackathonsShell';

export const metadata = {
  title: 'Hackathons & Events — TruMatch',
  description: 'Discover, join, and get AI-matched with commitment-scored teammates for upcoming hackathons.',
};

async function getHackathons(token: string): Promise<HackathonSummary[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/hackathons`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HackathonsPage() {
  const token = await getSessionToken();
  if (!token) redirect('/');

  const user = await getCurrentUser();
  if (!user) redirect('/');

  const hackathons = await getHackathons(token);

  return <HackathonsShell user={user} initialHackathons={hackathons} />;
}
