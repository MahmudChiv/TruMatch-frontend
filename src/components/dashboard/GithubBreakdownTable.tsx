'use client';

import { useState } from 'react';
import type { GithubMetricsData, RepoSignals } from '@/lib/api/types';

interface Props {
  githubMetrics: GithubMetricsData | null;
  isLoading: boolean;
  onResync?: () => void;
  syncState?: 'idle' | 'queuing' | 'syncing' | 'done' | 'error';
  syncMessage?: string;
}

function Bar({ value, color }: { value: number | null; color: string }) {
  if (value === null) {
    return (
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        N/A (0 activity)
      </span>
    );
  }
  const pct = Math.min(Math.max(Math.round(value * 100), 0), 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '140px' }}>
      <div style={{
        flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: '99px',
          transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '30px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function GithubBreakdownTable({ githubMetrics, isLoading, onResync, syncState, syncMessage }: Props) {
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={wrapStyle}>
        <span style={titleStyle}>GitHub Activity Breakdown</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...skeletonStyle, height: '48px' }} />
          ))}
        </div>
      </div>
    );
  }

  const repos: RepoSignals[] = (githubMetrics?.repoBreakdown ?? []) as RepoSignals[];
  const overallScore = githubMetrics?.githubConsistencyScore ?? null;

  return (
    <div style={wrapStyle}>
      {/* Table Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={titleStyle}>GitHub Activity Breakdown</span>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Per-repository signals feeding your GitHub consistency score.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {overallScore !== null && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OVERALL GITHUB SCORE</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>{Math.round(overallScore)}</span>
            </div>
          )}

          {onResync && (
            <button
              id="resync-github-btn"
              onClick={onResync}
              disabled={syncState === 'queuing' || syncState === 'syncing'}
              style={{
                padding: '7px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
                background: 'var(--surface-raised)', color: 'var(--text-primary)',
                fontSize: '0.78rem', fontWeight: 600, cursor: syncState === 'queuing' || syncState === 'syncing' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                opacity: syncState === 'queuing' || syncState === 'syncing' ? 0.6 : 1,
                transition: 'opacity 0.2s, background 0.2s',
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
          )}
        </div>
      </div>

      {syncMessage && (
        <div style={{
          marginBottom: '16px', fontSize: '0.75rem',
          color: syncState === 'error' ? '#f87171' : syncState === 'done' ? '#34d399' : '#a78bfa',
        }}>
          {syncMessage}
        </div>
      )}

      {/* Table container */}
      {repos.length === 0 ? (
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
          No qualifying repositories found. GitHub sync may still be running, or your repos didn't meet the minimum activity threshold.
        </p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                <th style={thStyle}>Repository</th>
                <th style={thStyle}>Commit Consistency</th>
                <th style={thStyle}>PR Follow-through</th>
                <th style={thStyle}>Issue Resolution</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo, i) => {
                const scoreColor = repo.repoScore >= 70 ? '#34d399' : repo.repoScore >= 45 ? '#fbbf24' : '#f87171';
                const isExpanded = expandedRepo === repo.fullName;

                return (
                  <tr
                    key={repo.fullName || i}
                    onClick={() => setExpandedRepo(isExpanded ? null : repo.fullName)}
                    style={{
                      borderBottom: i === repos.length - 1 ? 'none' : '1px solid var(--border-light)',
                      background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.03)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent';
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px',
                          background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700,
                        }}>
                          {repo.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                            {repo.name}
                          </span>
                          {repo.fullName && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {repo.fullName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <Bar value={repo.commitGapConsistency} color="#60a5fa" />
                    </td>

                    <td style={tdStyle}>
                      <Bar value={repo.prMergeRatio} color="#34d399" />
                    </td>

                    <td style={tdStyle}>
                      <Bar value={repo.issueCloseRatio} color="#f59e0b" />
                    </td>

                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '99px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: scoreColor,
                        background: `${scoreColor}15`,
                        border: `1px solid ${scoreColor}30`,
                      }}>
                        {Math.round(repo.repoScore)}/100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const wrapStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-mid)',
  borderRadius: '20px',
  padding: '24px 28px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
  display: 'block',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};

const skeletonStyle: React.CSSProperties = {
  borderRadius: '12px',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
};
