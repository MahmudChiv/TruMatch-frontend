'use client';

import type { CommitmentScoreData } from '@/lib/api/types';

interface HistoryPoint {
  date: string;
  score: number;
}

interface Props {
  commitmentScore: CommitmentScoreData | null;
  isLoading: boolean;
}

function buildPoints(commitmentScore: CommitmentScoreData | null): HistoryPoint[] {
  if (!commitmentScore) return [];
  // Future: fetch actual history. For now build a single point so the chart
  // renders and the user sees the expectation of evolving scores.
  return [
    {
      date: new Date(commitmentScore.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short',
      }),
      score: Math.round(commitmentScore.commitmentScore),
    },
  ];
}

export default function ScoreHistoryChart({ commitmentScore, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={wrapStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>Score History</span>
        </div>
        <div style={skeletonStyle} />
      </div>
    );
  }

  const points = buildPoints(commitmentScore);

  const W = 560;
  const H = 140;
  const PAD = { top: 16, right: 24, bottom: 32, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Y-axis: 0–100
  const toY = (score: number) => PAD.top + innerH - (score / 100) * innerH;
  // X-axis: distribute evenly; if single point, center it
  const toX = (i: number, total: number) =>
    total === 1
      ? PAD.left + innerW / 2
      : PAD.left + (i / (total - 1)) * innerW;

  const yTicks = [0, 25, 50, 75, 100];

  const buildPath = (): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return ''; // single point — draw dot instead
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, points.length)} ${toY(p.score)}`)
      .join(' ');
    const areaClose = ` L ${toX(points.length - 1, points.length)} ${toY(0)} L ${toX(0, points.length)} ${toY(0)} Z`;
    return d + areaClose;
  };

  const linePath = points.length > 1
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, points.length)} ${toY(p.score)}`).join(' ')
    : '';

  return (
    <div style={wrapStyle}>
      <div style={titleRowStyle}>
        <span style={titleStyle}>Score History</span>
        <span style={badgeStyle}>Live — updates with peer ratings</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: '100%', minWidth: '280px', height: `${H}px`, display: 'block' }}
          aria-label="Score history chart"
        >
          <defs>
            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis gridlines */}
          {yTicks.map(tick => (
            <g key={tick}>
              <line
                x1={PAD.left} y1={toY(tick)}
                x2={W - PAD.right} y2={toY(tick)}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1"
              />
              <text
                x={PAD.left - 8} y={toY(tick) + 4}
                fill="rgba(255,255,255,0.25)" fontSize="9"
                textAnchor="end" fontFamily="var(--font-edu-hand), cursive"
              >{tick}</text>
            </g>
          ))}

          {/* Area fill */}
          {points.length > 1 && (
            <path d={buildPath()} fill="url(#area-grad)" />
          )}

          {/* Line */}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none" stroke="#a78bfa" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {points.map((p, i) => {
            const x = toX(i, points.length);
            const y = toY(p.score);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="#a78bfa" />
                <circle cx={x} cy={y} r="9" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.35" />
                {/* Score label above dot */}
                <text
                  x={x} y={y - 14}
                  fill="#c4b5fd" fontSize="10" textAnchor="middle"
                  fontWeight="700" fontFamily="var(--font-edu-hand), cursive"
                >{p.score}</text>
                {/* Date label below */}
                <text
                  x={x} y={H - 6}
                  fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle"
                  fontFamily="var(--font-edu-hand), cursive"
                >{p.date}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {points.length <= 1 && (
        <p style={{
          fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center',
          marginTop: '8px', lineHeight: 1.6,
        }}>
          One data point so far. As peer ratings from completed projects are added,
          your score trend will appear here.
        </p>
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
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  marginBottom: '20px', gap: '12px', flexWrap: 'wrap',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)',
  padding: '3px 10px', borderRadius: '99px',
  border: '1px solid var(--border)', letterSpacing: '0.04em',
};

const skeletonStyle: React.CSSProperties = {
  height: '140px', borderRadius: '12px',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
};
