'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DashboardData } from '@/lib/api/types';
import ScoreHeroCard from '@/components/dashboard/ScoreHeroCard';
import ScoreHistoryChart from '@/components/dashboard/ScoreHistoryChart';
import GithubBreakdownList from '@/components/dashboard/GithubBreakdownList';
import InterviewSummaryCard from '@/components/dashboard/InterviewSummaryCard';
import ProfileSection from '@/components/dashboard/ProfileSection';
import Image from 'next/image';

interface Props {
  initialData: DashboardData;
}

export default function DashboardShell({ initialData }: Props) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      if (res.ok) {
        const fresh: DashboardData = await res.json();
        setData(fresh);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  if (!data.user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <p>Could not load your profile. <a href="/" style={{ color: 'var(--text-primary)' }}>Go home</a></p>
      </div>
    );
  }

  return (
    <>
      {/* ── Topbar ── */}
      <header style={headerStyle}>
        <nav style={navStyle}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/logo.svg" alt="TruMatch" width={30} height={30} priority />
            <span style={{
              fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em',
              background: 'linear-gradient(135deg, #f0ece4 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>TruMatch</span>
          </a>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dashboard</span>
        </nav>
      </header>

      {/* ── Page body ── */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 20px 60px', width: '100%' }}>
        {/* Refresh indicator */}
        {isRefreshing && (
          <div style={{
            position: 'fixed', top: '72px', right: '20px', zIndex: 200,
            padding: '6px 14px', borderRadius: '8px',
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            fontSize: '0.72rem', color: '#a78bfa',
          }}>
            Refreshing…
          </div>
        )}

        {/* ── Section 1: Profile ── */}
        <section aria-label="Profile" style={{ marginBottom: '20px' }}>
          <ProfileSection
            user={data.user}
            githubMetrics={data.githubMetrics}
            onSyncComplete={refresh}
          />
        </section>

        {/* ── Section 2: Score Hero ── */}
        <section aria-label="Commitment Score" style={{ marginBottom: '20px' }}>
          <ScoreHeroCard commitmentScore={data.commitmentScore} isLoading={false} />
        </section>

        {/* ── Section 3: Score History ── */}
        <section aria-label="Score History" style={{ marginBottom: '20px' }}>
          <ScoreHistoryChart commitmentScore={data.commitmentScore} isLoading={false} />
        </section>

        {/* ── Section 4: Two-column — GitHub + Interview ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}>
          <section aria-label="GitHub Breakdown">
            <GithubBreakdownList githubMetrics={data.githubMetrics} isLoading={false} />
          </section>
          <section aria-label="Interview Summary">
            <InterviewSummaryCard interviewSession={data.interviewSession} isLoading={false} />
          </section>
        </div>
      </main>

      {/* ── Footer note ── */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          TruMatch · Commitment is earned, not claimed.
        </p>
      </footer>
    </>
  );
}

const headerStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
  background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const navStyle: React.CSSProperties = {
  maxWidth: '900px', margin: '0 auto', padding: '0 20px',
  height: '64px', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
};
