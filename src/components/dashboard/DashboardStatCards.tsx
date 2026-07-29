'use client';

import type { CommitmentScoreData, GithubMetricsData, InterviewSessionData } from '@/lib/api/types';

interface Props {
  commitmentScore: CommitmentScoreData | null;
  githubMetrics: GithubMetricsData | null;
  interviewSession: InterviewSessionData | null;
}

export default function DashboardStatCards({ commitmentScore, githubMetrics, interviewSession }: Props) {
  const score = commitmentScore?.commitmentScore ?? 0;
  const github = commitmentScore?.githubScore ?? githubMetrics?.githubConsistencyScore ?? 0;

  const interview = commitmentScore?.interviewScore ?? interviewSession?.structuredOutput?.specificity_score ?? 0;

  const reposCount = githubMetrics?.repoBreakdown?.length ?? 0;

  const scoreColor = score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171';

  const stats = [
    {
      label: 'Commitment Score',
      value: commitmentScore ? `${Math.round(score)}/100` : '—',
      color: scoreColor,
      subtext: commitmentScore ? (score >= 70 ? 'Strong signal' : score >= 45 ? 'Moderate signal' : 'Building signal') : 'Pending interview',
    },
    {
      label: 'GitHub Consistency',
      value: github ? `${Math.round(github)}%` : '—',
      color: '#60a5fa',
      subtext: '70% weight in score',
    },
    {
      label: 'Interview Specificity',
      value: interview ? `${Math.round(interview)}%` : '—',
      color: '#c084fc',
      subtext: '30% weight in score',
    },
    {
      label: 'Repos Analyzed',
      value: `${reposCount}`,
      color: 'var(--text-primary)',
      subtext: reposCount === 1 ? '1 active repo' : `${reposCount} active repos`,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-mid)',
            borderRadius: '16px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {stat.label}
          </span>
          <span style={{ fontSize: '1.85rem', fontWeight: 800, color: stat.color, lineHeight: 1.2, marginTop: '2px' }}>
            {stat.value}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {stat.subtext}
          </span>
        </div>
      ))}
    </div>
  );
}
