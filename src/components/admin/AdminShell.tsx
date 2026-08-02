'use client';

import { useState } from 'react';
import type { AdminQueueItem, UserProfile } from '@/lib/api/types';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface Props {
  user: UserProfile;
  initialQueue: AdminQueueItem[];
}

export default function AdminShell({ user, initialQueue }: Props) {
  const [queue, setQueue] = useState<AdminQueueItem[]>(initialQueue);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const handleUpdateStatus = async (id: string, status: 'verified' | 'flagged') => {
    setActionMessage('');
    try {
      const res = await fetch(`/api/admin/hackathons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setQueue((prev) => prev.filter((item) => item.id !== id));
        setActionMessage(`Hackathon updated to ${status}.`);
        setTimeout(() => setActionMessage(''), 3000);
      } else {
        const err = await res.json();
        setActionMessage(`Failed to update status: ${err.message || 'Unknown error'}`);
      }
    } catch {
      setActionMessage('Failed to update status.');
    }
  };

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <main
          style={{
            flex: 1,
            padding: '28px 32px 48px',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <DashboardHeader user={user} />

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              🛡️ Admin Moderation Queue
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Review pending and reported hackathon listings. Verified listings appear publicly across the app.
            </p>
          </div>

          {actionMessage && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                color: '#34d399',
                fontSize: '0.84rem',
                marginBottom: '20px',
              }}
            >
              {actionMessage}
            </div>
          )}

          {queue.length === 0 ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px border-dashed var(--border)',
                borderRadius: '16px',
                padding: '48px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                🎉 The moderation queue is empty! No pending or flagged listings to review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {queue.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--surface)',
                    border:
                      item.status === 'flagged'
                        ? '1px solid rgba(248, 113, 113, 0.3)'
                        : '1px solid var(--border-mid)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {item.title}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '99px',
                            background:
                              item.status === 'flagged'
                                ? 'rgba(248, 113, 113, 0.15)'
                                : 'rgba(255, 255, 255, 0.08)',
                            border:
                              item.status === 'flagged'
                                ? '1px solid rgba(248, 113, 113, 0.3)'
                                : '1px solid var(--border)',
                            color: item.status === 'flagged' ? '#f87171' : 'var(--text-secondary)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.status}
                        </span>
                      </div>

                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}
                      >
                        🔗 {item.externalUrl} ↗
                      </a>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'flagged')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: 'rgba(248, 113, 113, 0.1)',
                          border: '1px solid rgba(248, 113, 113, 0.25)',
                          color: '#f87171',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reject / Flag
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'verified')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'var(--text-primary)',
                          border: 'none',
                          color: '#0a0a0a',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Approve (Verify)
                      </button>
                    </div>
                  </div>

                  {/* Submitter & Stats */}
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>Submitted by: <strong>@{item.submitter.username}</strong> ({item.submitter.email || 'No email'})</span>
                    <span>Vouches: {item._count.vouches}</span>
                    <span>Reports: {item._count.reports}</span>
                    <span>Joins: {item._count.joins}</span>
                  </div>

                  {/* Reports list */}
                  {item.reports && item.reports.length > 0 && (
                    <div
                      style={{
                        background: 'rgba(248, 113, 113, 0.05)',
                        border: '1px solid rgba(248, 113, 113, 0.15)',
                        borderRadius: '10px',
                        padding: '12px',
                      }}
                    >
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f87171', margin: '0 0 6px' }}>
                        User Reports ({item.reports.length})
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {item.reports.map((r, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            <strong>@{r.user.username}:</strong> "{r.reason}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
