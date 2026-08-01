'use client';

import { useState } from 'react';
import type { GithubMetricsData, RepoSignals } from '@/lib/api/types';

interface Props {
  githubMetrics: GithubMetricsData | null;
  isLoading: boolean;
}

function Bar({ value, color }: { value: number | null; color: string }) {
  if (value === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          N/A (0 activity)
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.round(value * 100)}%`, height: '100%',
          background: color, borderRadius: '99px',
          transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '30px', textAlign: 'right' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function RepoRow({ repo, index }: { repo: RepoSignals; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
      background: 'var(--surface-raised)',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', textAlign: 'left', gap: '12px',
        }}
        aria-expanded={open}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <span style={{
            flexShrink: 0, width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700,
          }}>
            {repo.name.slice(0, 2).toUpperCase()}
          </span>
          <span style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {repo.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{
            fontSize: '0.8rem', fontWeight: 700,
            color: repo.repoScore >= 70 ? '#34d399' : repo.repoScore >= 45 ? '#fbbf24' : '#f87171',
          }}>
            {Math.round(repo.repoScore)}/100
          </span>
          <span style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>▼</span>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{
          padding: '0 18px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            {[
              { label: 'Commit Consistency', value: repo.commitGapConsistency, color: '#60a5fa', desc: 'How regular your commit cadence was' },
              { label: 'PR Follow-through', value: repo.prMergeRatio, color: '#34d399', desc: 'Ratio of PRs that were merged' },
              { label: 'Issue Resolution', value: repo.issueCloseRatio, color: '#f59e0b', desc: 'Ratio of issues you closed' },
              { label: 'Project Completion', value: repo.completionSignal, color: '#c084fc', desc: 'Whether the repo wound down gracefully' },
            ].map(metric => (
              <div key={metric.label} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>{metric.label}</span>
                <Bar value={metric.value} color={metric.color} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{metric.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GithubBreakdownList({ githubMetrics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={wrapStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>GitHub Activity Breakdown</span>
        </div>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ ...skeletonStyle, height: '56px', marginBottom: '8px' }} />
        ))}
      </div>
    );
  }

  const repos: RepoSignals[] = (githubMetrics?.repoBreakdown ?? []) as RepoSignals[];
  const overallScore = githubMetrics?.githubConsistencyScore ?? null;

  return (
    <div style={wrapStyle}>
      <div style={titleRowStyle}>
        <div>
          <span style={titleStyle}>GitHub Activity Breakdown</span>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Per-repo signals feeding your GitHub score — inspect what went into the number.
          </p>
        </div>
        {overallScore !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>GITHUB SCORE</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>{Math.round(overallScore)}</span>
          </div>
        )}
      </div>

      {repos.length === 0 ? (
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          No qualifying repositories found. GitHub sync may still be running, or your repos didn't meet the minimum activity threshold.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {repos.map((repo, i) => (
            <RepoRow key={repo.fullName} repo={repo} index={i} />
          ))}
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

const titleRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
  marginBottom: '20px', gap: '12px', flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
  display: 'block',
};

const skeletonStyle: React.CSSProperties = {
  borderRadius: '12px',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
};
