'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import type { UserProfile, GithubMetricsData } from '@/lib/api/types';

interface Props {
  user: UserProfile;
  githubMetrics: GithubMetricsData | null;
  onSyncComplete: () => void; // parent refreshes dashboard data
}

type SyncState = 'idle' | 'queuing' | 'syncing' | 'done' | 'error';

export default function ProfileSection({ user, githubMetrics, onSyncComplete }: Props) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleResync = useCallback(async () => {
    if (syncState === 'queuing' || syncState === 'syncing') return;
    setSyncState('queuing');
    setSyncMessage('');

    try {
      // 1. Enqueue the sync job
      const res = await fetch('/api/github-sync', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        setSyncState('error');
        setSyncMessage(err.error || 'Failed to start re-sync.');
        return;
      }

      setSyncState('syncing');
      setSyncMessage('Syncing your GitHub activity…');

      // 2. Open WebSocket and wait for github-sync:complete
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
        socket.emit('subscribe', { userId: user.id });
      });

      socket.on('github-sync:progress', (data: { stage?: string }) => {
        setSyncMessage(data.stage || 'Syncing your GitHub activity…');
      });

      socket.on('github-sync:complete', (data: { status: string }) => {
        cleanup();
        if (data.status === 'complete') {
          setSyncState('done');
          setSyncMessage('GitHub data updated!');
          // Notify parent to re-fetch dashboard data
          onSyncComplete();
          // Reset to idle after 3s
          setTimeout(() => setSyncState('idle'), 3000);
        } else {
          setSyncState('error');
          setSyncMessage('Sync finished with errors. Your previous score is shown.');
        }
      });

      socket.on('github-sync:error', () => {
        cleanup();
        setSyncState('error');
        setSyncMessage('Sync failed. Please try again.');
      });

      socket.on('disconnect', () => {
        setSyncState('error');
        setSyncMessage('Connection lost. Please try again.');
      });

    } catch {
      setSyncState('error');
      setSyncMessage('Unexpected error. Please try again.');
    }
  }, [syncState, apiUrl, user.id, onSyncComplete]);

  const syncAt = githubMetrics?.updatedAt
    ? new Date(githubMetrics.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const avatarInitials = (user.name || user.username).slice(0, 2).toUpperCase();

  return (
    <div style={wrapStyle}>
      {/* ── Profile header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {user.avatarUrl ? (
          <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={64} height={64}
              style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: '14px', height: '14px', borderRadius: '50%',
              background: '#34d399', border: '2px solid var(--surface)',
            }} />
          </div>
        ) : (
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4f3a6b, #1e1b26)',
            border: '2px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 800, color: '#c4b5fd',
          }}>
            {avatarInitials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {user.name || user.username}
            </h1>
            <span style={{
              fontSize: '0.68rem', fontWeight: 600, padding: '2px 10px', borderRadius: '99px',
              background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)',
            }}>
              GitHub Verified
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            @{user.username}
            {user.email && <span style={{ marginLeft: '10px', color: 'var(--text-dim)' }}>{user.email}</span>}
          </p>
          {user.bio && (
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '20px 0' }} />

      {/* ── Re-sync row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            GitHub Activity
          </span>
          {syncAt && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Last synced: {syncAt}
            </span>
          )}
          {syncMessage && (
            <span style={{
              display: 'block', marginTop: '4px', fontSize: '0.72rem',
              color: syncState === 'error' ? '#f87171' : syncState === 'done' ? '#34d399' : '#a78bfa',
            }}>
              {syncMessage}
            </span>
          )}
        </div>

        <button
          id="resync-github-btn"
          onClick={handleResync}
          disabled={syncState === 'queuing' || syncState === 'syncing'}
          style={{
            padding: '8px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
            background: 'var(--surface-raised)', color: 'var(--text-primary)',
            fontSize: '0.82rem', fontWeight: 600, cursor: syncState === 'queuing' || syncState === 'syncing' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '7px',
            opacity: syncState === 'queuing' || syncState === 'syncing' ? 0.6 : 1,
            transition: 'opacity 0.2s, background 0.2s',
          }}
          onMouseEnter={e => {
            if (syncState !== 'queuing' && syncState !== 'syncing')
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-alt)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-raised)';
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: syncState === 'syncing' ? 'spin 1.2s linear infinite' : 'none',
          }}>
            {syncState === 'done' ? '✓' : '↻'}
          </span>
          {syncState === 'queuing' ? 'Queueing…' : syncState === 'syncing' ? 'Syncing…' : 'Re-sync GitHub'}
        </button>
      </div>

      {/* ── Account row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
        <a
          id="sign-out-link"
          href="/api/auth/signout"
          style={{
            fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none',
            padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => {
            const a = e.currentTarget;
            a.style.color = '#f87171';
            a.style.borderColor = 'rgba(248,113,113,0.3)';
          }}
          onMouseLeave={e => {
            const a = e.currentTarget;
            a.style.color = 'var(--text-muted)';
            a.style.borderColor = 'var(--border)';
          }}
        >
          Sign out
        </a>
      </div>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-mid)',
  borderRadius: '20px',
  padding: '24px 28px',
};
