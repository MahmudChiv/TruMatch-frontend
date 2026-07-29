'use client';

import type { InterviewSessionData, FlaggedDiscrepancy } from '@/lib/api/types';

interface Props {
  interviewSession: InterviewSessionData | null;
  isLoading: boolean;
}

export default function InterviewSummaryCard({ interviewSession, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={wrapStyle}>
        <span style={titleStyle}>Interview Summary</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {[80, 120, 60].map((h, i) => (
            <div key={i} style={{ ...skeletonStyle, height: `${h}px` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!interviewSession || interviewSession.status !== 'complete' || !interviewSession.structuredOutput) {
    const isInProgress = interviewSession && interviewSession.status === 'in_progress';
    return (
      <div style={wrapStyle}>
        <span style={titleStyle}>Interview Summary</span>
        <div style={{
          marginTop: '16px', padding: '20px',
          background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
          border: '1px dashed rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '1.5rem' }}>{isInProgress ? '💬' : '🎯'}</span>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            {isInProgress
              ? 'Your AI interview is in progress. Once completed, your interview breakdown will appear here.'
              : 'AI interview not yet completed. Head to the interview to unlock your full score breakdown.'}
          </p>
          {!isInProgress && (
            <a href="/interview" style={{
              marginTop: '6px', padding: '8px 20px',
              background: 'linear-gradient(135deg, #4f3a6b 0%, #2a2030 100%)',
              border: '1px solid rgba(167,139,250,0.3)', borderRadius: '10px',
              color: '#c4b5fd', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}>
              Take the Interview →
            </a>
          )}
        </div>
      </div>
    );
  }

  const output = interviewSession.structuredOutput;
  const score = output.specificity_score;
  const hours = output.declared_hours_per_day;
  const discrepancies: FlaggedDiscrepancy[] = output.flagged_discrepancies ?? [];
  const notes = output.communication_style_notes;

  const scoreColor = score >= 70 ? '#34d399' : score >= 45 ? '#fbbf24' : '#f87171';

  return (
    <div style={wrapStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span style={titleStyle}>Interview Summary</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SPECIFICITY</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor }}>{Math.round(score)}</span>
        </div>
      </div>

      {/* Hours declared */}
      {hours !== null && hours !== undefined && (
        <div style={infoRowStyle}>
          <span style={infoIconStyle}>⏱</span>
          <div>
            <span style={infoLabelStyle}>Declared availability</span>
            <span style={infoValueStyle}>{hours} hours/day</span>
          </div>
        </div>
      )}

      {/* Communication notes */}
      {notes && (
        <div style={{ ...infoRowStyle, alignItems: 'flex-start' }}>
          <span style={{ ...infoIconStyle, marginTop: '2px' }}>💬</span>
          <div>
            <span style={infoLabelStyle}>Communication style</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              {notes}
            </p>
          </div>
        </div>
      )}

      {/* Discrepancies */}
      {discrepancies.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            padding: '8px 14px', marginBottom: '10px',
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '0.7rem' }}>⚠️</span>
            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>
              {discrepancies.length} data point{discrepancies.length !== 1 ? 's' : ''} flagged for transparency — these are context notes, not accusations.
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {discrepancies.map((d, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b',
                    padding: '2px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.1)',
                  }}>{d.repo}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{d.issue}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  "{d.userExplanation}"
                </p>
              </div>
            ))}
          </div>
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

const infoRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px',
  marginTop: '16px', padding: '12px 14px',
  background: 'var(--surface-raised)', border: '1px solid var(--border)',
  borderRadius: '12px',
};

const infoIconStyle: React.CSSProperties = {
  fontSize: '1.1rem', flexShrink: 0,
};

const infoLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 600,
  color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '2px',
};

const infoValueStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)',
};

const skeletonStyle: React.CSSProperties = {
  borderRadius: '12px',
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
  backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
};
