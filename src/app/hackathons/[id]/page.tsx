import { redirect, notFound } from 'next/navigation';
import { getCurrentUser, getSessionToken } from '@/lib/auth';
import type { HackathonDetail } from '@/lib/api/types';
import HackathonDetailClient from '@/components/hackathons/HackathonDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getSessionToken();
  if (!token) return { title: 'Hackathon Detail — TruMatch' };

  const hackathon = await getHackathonDetail(id, token);
  return {
    title: hackathon ? `${hackathon.title} — TruMatch` : 'Hackathon Detail — TruMatch',
    description: hackathon?.description || 'Find teammates for this hackathon on TruMatch.',
  };
}

async function getHackathonDetail(id: string, token: string): Promise<HackathonDetail | null> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${backendUrl}/hackathons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HackathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getSessionToken();
  if (!token) redirect('/');

  const user = await getCurrentUser();
  if (!user) redirect('/');

  const hackathon = await getHackathonDetail(id, token);
  if (!hackathon) notFound();

  return <HackathonDetailClient user={user} initialHackathon={hackathon} />;
}
