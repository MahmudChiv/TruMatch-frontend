'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { HackathonSummary } from '@/lib/api/types';

interface Props {
  hackathon: HackathonSummary;
  onJoinToggle: (id: string, currentlyJoined: boolean) => Promise<void>;
  onVouch: (id: string) => Promise<void>;
  onReport: (id: string, reason: string) => Promise<void>;
}

export default function HackathonCard({
  hackathon,
  onJoinToggle,
  onVouch,
  onReport,
}: Props) {
  const [isJoining, setIsJoining] = useState(false);
  const [isVouching, setIsVouching] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [imageError, setImageError] = useState(false);
  /** Controls the expanded detail view — toggled by clicking the card header area */
  const [isExpanded, setIsExpanded] = useState(false);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJoining(true);
    try {
      await onJoinToggle(hackathon.id, hackathon.hasJoined);
    } finally {
      setIsJoining(false);
    }
  };

  const handleVouchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hackathon.hasVouched || hackathon.status === 'verified') return;
    setIsVouching(true);
    try {
      await onVouch(hackathon.id);
    } finally {
      setIsVouching(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setIsReporting(true);
    try {
      await onReport(hackathon.id, reportReason.trim());
      setShowReportModal(false);
      setReportReason('');
    } finally {
      setIsReporting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const startDate = formatDate(hackathon.startDate);
  const endDate = formatDate(hackathon.endDate);
  const appDeadline = formatDate(hackathon.applicationDeadline ?? null);
  const subDeadline = formatDate(hackathon.submissionDeadline ?? null);

  return (
    <>
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-mid)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          transition: 'border-color 0.2s',
          position: 'relative',
        }}
        className="hackathon-card"
      >
        {/* Header row: Logo + Status Badge + Venue badge — clicking title area toggles expanded detail view */}
        <div>
          <div
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? 'Click to collapse' : 'Click to expand details'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                {hackathon.logoUrl && !imageError ? (
                  <Image
                    src={hackathon.logoUrl}
                    alt={hackathon.title}
                    width={44}
                    height={44}
                    unoptimized
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  hackathon.title.slice(0, 2).toUpperCase()
                )}
              </div>

              <div>
                <a
                  href={`/hackathons/${hackathon.id}`}
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    lineHeight: 1.3,
                    display: 'block',
                  }}
                >
                  {hackathon.title}
                </a>

                {hackathon.locationLabel && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                    📍 {hackathon.locationLabel} {hackathon.distance != null ? `(${hackathon.distance} km)` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              {hackathon.status === 'verified' ? (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '99px',
                    background: 'rgba(52, 211, 153, 0.1)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    color: '#34d399',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ✓ Verified
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '99px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Unverified ({hackathon.vouchCount}/3 vouches)
                </span>
              )}

              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {hackathon.venueType}
              </span>
            </div>
          </div>

          {/* Collapsed preview: short description + date (2-line clamp) */}
          {!isExpanded && hackathon.description && (
            <p
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                margin: '8px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {hackathon.description}
            </p>
          )}

          {/* Collapsed date summary */}
          {!isExpanded && (startDate || endDate) && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '6px 0' }}>
              🗓️ {startDate} {endDate ? `– ${endDate}` : ''}
            </div>
          )}

          {/* ── EXPANDED DETAIL VIEW ── */}
          {isExpanded && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* 1. Full Description (prefer fullDescription, fallback to shortDescription/description) */}
              {(hackathon.fullDescription || hackathon.shortDescription || hackathon.description) && (
                <div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {hackathon.fullDescription || hackathon.shortDescription || hackathon.description}
                  </p>
                </div>
              )}

              {/* 2. Eligibility & Team Size */}
              {(hackathon.eligibility || hackathon.teamSize) && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {hackathon.eligibility && (
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Eligibility</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{hackathon.eligibility}</div>
                    </div>
                  )}
                  {hackathon.teamSize && (
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Team Size</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{hackathon.teamSize}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Dates — only show date rows that have data */}
              {(startDate || endDate || appDeadline || subDeadline) && (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {(startDate || endDate) && (
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Event Dates</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        🗓️ {startDate}{endDate && startDate !== endDate ? ` – ${endDate}` : ''}
                      </div>
                    </div>
                  )}
                  {appDeadline && (
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Apply By</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>⏰ {appDeadline}</div>
                    </div>
                  )}
                  {subDeadline && (
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Submit By</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>📬 {subDeadline}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Prize info */}
              {(hackathon.prizePoolTotal || hackathon.prizeInfo) && (
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>🏆 Prize</div>
                  {hackathon.prizePoolTotal && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{hackathon.prizePoolTotal}</div>
                  )}
                  {hackathon.prizeBreakdown && Array.isArray(hackathon.prizeBreakdown) && (hackathon.prizeBreakdown as Array<{place: string; prize: string}>).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(hackathon.prizeBreakdown as Array<{place: string; prize: string}>).map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{p.place}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.prize}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!hackathon.prizePoolTotal && hackathon.prizeInfo && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{hackathon.prizeInfo}</div>
                  )}
                </div>
              )}

              {/* 5. External link — shows 'Website not yet available' if null */}
              <div>
                {hackathon.externalUrl ? (
                  <a
                    href={hackathon.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border-mid)', display: 'inline-block' }}
                  >
                    🔗 Open Event Page ↗
                  </a>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Website not yet available</span>
                )}
              </div>
            </div>
          )}

          {/* Tags — always shown (collapsed and expanded) */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {hackathon.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Expand/collapse toggle hint */}
          <button
            onClick={() => setIsExpanded((v) => !v)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', padding: '4px 0 0', textAlign: 'left' }}
          >
            {isExpanded ? '▴ Collapse' : '▾ Show details'}
          </button>
        </div>

        {/* Footer row: Social proof + Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            gap: '12px',
          }}
        >
          {/* Join Count + External Link (collapsed footer only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              👥 {hackathon.joinCount} joined
            </span>

            {/* Show external link in footer only when collapsed (expanded view has its own link) */}
            {!isExpanded && hackathon.externalUrl && (
              <a
                href={hackathon.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  opacity: 0.8,
                }}
                title="Open event page"
              >
                🔗 Details ↗
              </a>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Report flag */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReportModal(true);
              }}
              title="Report listing"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '6px',
              }}
            >
              🚩
            </button>

            {/* Vouch button (if unverified) */}
            {hackathon.status !== 'verified' && (
              <button
                onClick={handleVouchClick}
                disabled={isVouching || hackathon.hasVouched}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  background: hackathon.hasVouched ? 'rgba(255,255,255,0.05)' : 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  color: hackathon.hasVouched ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: hackathon.hasVouched || isVouching ? 'default' : 'pointer',
                }}
              >
                {hackathon.hasVouched ? 'Vouched ✓' : isVouching ? '…' : '+ Vouch'}
              </button>
            )}

            {/* Join / Leave toggle */}
            <button
              onClick={handleJoinClick}
              disabled={isJoining}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: hackathon.hasJoined
                  ? 'rgba(52, 211, 153, 0.15)'
                  : 'var(--text-primary)',
                border: hackathon.hasJoined
                  ? '1px solid rgba(52, 211, 153, 0.3)'
                  : '1px solid transparent',
                color: hackathon.hasJoined ? '#34d399' : '#0a0a0a',
                cursor: isJoining ? 'wait' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {hackathon.hasJoined ? 'Joined ✓' : isJoining ? '…' : 'Join Pool'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              Report "{hackathon.title}"
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Please state why this listing is invalid, spam, or misleading. Submitting a report helps keep the platform safe.
            </p>

            <form onSubmit={handleReportSubmit}>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Reason for report (e.g. Broken link, fake event, spam)"
                required
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: '16px',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReporting || !reportReason.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--text-primary)',
                    border: 'none',
                    color: '#0a0a0a',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: isReporting ? 'wait' : 'pointer',
                  }}
                >
                  {isReporting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
