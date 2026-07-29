'use client';

import { useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { DashboardData } from '@/lib/api/types';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import ScoreHeroCard from '@/components/dashboard/ScoreHeroCard';
import ScoreHistoryChart from '@/components/dashboard/ScoreHistoryChart';
import InterviewSummaryCard from '@/components/dashboard/InterviewSummaryCard';
import GithubBreakdownTable from '@/components/dashboard/GithubBreakdownTable';

interface Props {
  initialData: DashboardData;
}

type SyncState = 'idle' | 'queuing' | 'syncing' | 'done' | 'error';

export default function DashboardShell({ initialData }: Props) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync state management
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

  const handleResync = useCallback(async () => {
    if (syncState === 'queuing' || syncState === 'syncing') return;
    setSyncState('queuing');
    setSyncMessage('');

    try {
      const res = await fetch('/api/github-sync', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setSyncState('error');
        setSyncMessage(err.error || 'Failed to start re-sync.');
        return;
      }

      setSyncState('syncing');
      setSyncMessage('Syncing your GitHub activity…');

      const token = document.cookie
        .split('; ')
        .find(c => c.startsWith('trumatch_token='))
        ?.split('=')[1];

      const socket: Socket = io(apiUrl, {
        path: '/github-sync',
        transports: ['websocket'],
        auth: { token },
      });

      const cleanup = () => { socket.disconnect(); };

      socket.on('connect', () => {
        if (data.user?.id) {
          socket.emit('subscribe', { userId: data.user.id });
        }
      });

      socket.on('github-sync:progress', (evt: { stage?: string }) => {
        setSyncMessage(evt.stage || 'Syncing your GitHub activity…');
      });

      socket.on('github-sync:complete', (evt: { status: string }) => {
        cleanup();
        if (evt.status === 'complete') {
          setSyncState('done');
          setSyncMessage('GitHub data updated!');
          refresh();
          setTimeout(() => setSyncState('idle'), 3000);
        } else {
          setSyncState('error');
          setSyncMessage('Sync finished with errors.');
        }
      });

      socket.on('github-sync:error', () => {
        cleanup();
        setSyncState('error');
        setSyncMessage('Sync failed. Please try again.');
      });

      socket.on('disconnect', () => {
        setSyncState('error');
        setSyncMessage('Connection lost.');
      });
    } catch {
      setSyncState('error');
      setSyncMessage('Unexpected error.');
    }
  }, [syncState, apiUrl, data.user?.id, refresh]);

  if (!data.user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <p>Could not load your profile. <a href="/" style={{ color: 'var(--text-primary)' }}>Go home</a></p>
      </div>
    );
  }

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* ── 1. Persistent Left Sidebar ── */}
      <DashboardSidebar
        user={data.user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />

      {/* ── 2. Main Scrollable Container ── */}
      <div style={{
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: '28px 32px 48px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
        }}>
          {/* Refresh indicator floating pill */}
          {isRefreshing && (
            <div style={{
              position: 'fixed', top: '20px', right: '24px', zIndex: 200,
              padding: '6px 14px', borderRadius: '8px',
              background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
              fontSize: '0.72rem', color: '#a78bfa',
            }}>
              Refreshing…
            </div>
          )}

          {/* ── Top Header Bar ── */}
          <DashboardHeader user={data.user} />

          {/* ── Stat Card Row (4 equal columns) ── */}
          <DashboardStatCards
            commitmentScore={data.commitmentScore}
            githubMetrics={data.githubMetrics}
            interviewSession={data.interviewSession}
          />

          {/* ── Two-Column Main Grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '24px',
            alignItems: 'start',
          }}>
            {/* Left Column (Wider ~1.6fr equivalent in responsive layout) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              minWidth: 0,
              flex: '1.6 1 0%',
            }}>
              {/* Animated Arc Gauge / Commitment Score Card */}
              <section aria-label="Commitment Score Gauge">
                <ScoreHeroCard commitmentScore={data.commitmentScore} isLoading={false} />
              </section>

              {/* Score History Chart */}
              <section aria-label="Score History Chart">
                <ScoreHistoryChart commitmentScore={data.commitmentScore} isLoading={false} />
              </section>
            </div>

            {/* Right Column (Narrower ~1fr equivalent) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              minWidth: 0,
              flex: '1 1 0%',
            }}>
              {/* Interview Summary Card (Summary + Flagged Discrepancies) */}
              <section aria-label="Interview Summary">
                <InterviewSummaryCard interviewSession={data.interviewSession} isLoading={false} />
              </section>
            </div>
          </div>

          {/* ── Full-Width GitHub Activity Table at Bottom ── */}
          <section aria-label="GitHub Activity Breakdown Table">
            <GithubBreakdownTable
              githubMetrics={data.githubMetrics}
              isLoading={false}
              onResync={handleResync}
              syncState={syncState}
              syncMessage={syncMessage}
            />
          </section>
        </main>

        {/* ── Footer ── */}
        <footer style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            TruMatch · Commitment is earned, not claimed.
          </p>
        </footer>
      </div>
    </div>
  );
}
