'use client';

import { useEffect, useRef, useState } from 'react';
import type { CommitmentScoreData } from '@/lib/api/types';

interface Props {
  commitmentScore: CommitmentScoreData | null;
  isLoading: boolean;
}

function useCountUp(target: number, duration = 1200, skip = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (skip) { setValue(target); return; }
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, skip]);
  return value;
}

function ScoreArc({ score, size = 180 }: { score: number; size?: number }) {
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  // Arc spans 240deg (start -210deg, end 30deg)
  const startAngle = -210;
  const totalDeg = 240;
  const pct = Math.min(score / 100, 1);
  const fillDeg = totalDeg * pct;

  const toXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (from: number, to: number, color: string) => {
    const s = toXY(from);
    const e = toXY(to);
    const large = to - from > 180 ? 1 : 0;
    return (
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Track */}
      {arcPath(startAngle, startAngle + totalDeg, 'rgba(255,255,255,0.06)')}
      {/* Fill */}
      {fillDeg > 0 && arcPath(startAngle, startAngle + fillDeg,
        score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171')}
    </svg>
  );
}

export default function ScoreHeroCard({ commitmentScore, isLoading }: Props) {
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const composite = commitmentScore?.commitmentScore ?? 0;
  const github = commitmentScore?.githubScore ?? 0;
  const interview = commitmentScore?.interviewScore ?? 0;

  const animatedComposite = useCountUp(composite, 1400, prefersReduced || isLoading);
  const animatedGithub = useCountUp(github, 1200, prefersReduced || isLoading);
  const animatedInterview = useCountUp(interview, 1000, prefersReduced || isLoading);

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div style={skeletonLgStyle} />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <div style={{ ...skeletonStyle, flex: 1 }} />
          <div style={{ ...skeletonStyle, flex: 1 }} />
        </div>
      </div>
    );
  }

  if (!commitmentScore) {
    return (
      <div style={cardStyle}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center' }}>
          Interview not yet completed. Your full commitment score will appear here once you finish the AI interview.
        </p>
      </div>
    );
  }

  const scoreColor = composite >= 70 ? '#34d399' : composite >= 45 ? '#fbbf24' : '#f87171';
  const scoreLabel = composite >= 70 ? 'Strong' : composite >= 45 ? 'Moderate' : 'Building';

  return (
    <div style={cardStyle}>
      {/* ── Hero score ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <div style={{ position: 'relative', width: 180, height: 180 }}>
          <ScoreArc score={composite} size={180} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {animatedComposite}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.08em' }}>
              / 100
            </span>
          </div>
        </div>
        <span style={{
          fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Commitment Score
        </span>
        <span style={{
          display: 'inline-block', marginTop: '2px',
          padding: '3px 12px', borderRadius: '99px',
          fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
          background: `${scoreColor}18`, color: scoreColor,
          border: `1px solid ${scoreColor}40`,
        }}>
          {scoreLabel}
        </span>
      </div>

      {/* ── Sub-score cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px', width: '100%' }}>
        <div style={subCardStyle}>
          <span style={subLabelStyle}>GitHub Consistency</span>
          <span style={subWeightStyle}>70% weight</span>
          <span style={{ ...subScoreStyle, color: '#60a5fa' }}>{animatedGithub}</span>
          <span style={subDescStyle}>Commit cadence &amp; repo signals</span>
        </div>
        <div style={subCardStyle}>
          <span style={subLabelStyle}>Interview Specificity</span>
          <span style={subWeightStyle}>30% weight</span>
          <span style={{ ...subScoreStyle, color: '#c084fc' }}>{animatedInterview}</span>
          <span style={subDescStyle}>Concrete details &amp; transparency</span>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={disclaimerStyle}>
        <span style={{ fontSize: '0.9rem', opacity: 0.65, marginRight: '6px' }}>ⓘ</span>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>This score is a starting signal, not a final verdict.</strong>{' '}
          GitHub activity measures consistency, not full reliability. The score becomes more accurate as peer ratings from real projects are added over time.
        </p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-mid)',
  borderRadius: '20px',
  padding: '32px 28px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0',
};

const subCardStyle: React.CSSProperties = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const subLabelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '0.01em',
};

const subWeightStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
};

const subScoreStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 800,
  lineHeight: 1.1,
  marginTop: '4px',
};

const subDescStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  marginTop: '2px',
};

const disclaimerStyle: React.CSSProperties = {
  marginTop: '20px',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '2px',
  width: '100%',
};

const skeletonStyle: React.CSSProperties = {
  height: '80px',
  borderRadius: '12px',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

const skeletonLgStyle: React.CSSProperties = {
  width: '180px', height: '180px', borderRadius: '50%',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};
