'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type {
  CandidateMatchResult,
  FindTeammatesResponse,
  TeamCharter,
} from '@/lib/api/types';

interface Props {
  hackathonId: string;
  hackathonTitle: string;
  onClose: () => void;
}

export default function FindTeammatesModal({
  hackathonId,
  hackathonTitle,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<CandidateMatchResult[]>([]);
  const [targetSize, setTargetSize] = useState(4);
  const [invitedUserIds, setInvitedUserIds] = useState<Record<string, boolean>>({});
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);

  // Selected candidate for viewing full Team Charter
  const [charterCandidateId, setCharterCandidateId] = useState<string | null>(null);

  const fetchTeammates = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/find-teammates`, {
        method: 'POST',
      });
      const data: FindTeammatesResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch candidate matches');
        return;
      }
      setCandidates(data.candidates || []);
      setTargetSize(data.targetSize || 4);
    } catch {
      setError('Unexpected network error fetching matches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeammates();
  }, [hackathonId]);

  const handleSendInvite = async (candidate: CandidateMatchResult) => {
    setSendingInviteId(candidate.user.id);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: candidate.user.id,
          charterJson: candidate.teamCharter,
        }),
      });

      if (res.ok) {
        setInvitedUserIds((prev) => ({ ...prev, [candidate.user.id]: true }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to send invite.');
      }
    } catch {
      alert('Error sending invite.');
    } finally {
      setSendingInviteId(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-mid)',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#c084fc', textTransform: 'uppercase' }}>
              🤖 AI Matchmaker
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              Teammate Suggestions for {hackathonTitle}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Target Team Size: {targetSize} members • Ranked by commitment compatibility & complementary roles
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{
              width: '36px', height: '36px', border: '3px solid rgba(192,132,252,0.2)',
              borderTopColor: '#c084fc', borderRadius: '50%', margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Analyzing Candidate Pool & Drafting Charters...
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Matching role tags, availability, and commitment scores with Gemini AI
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.82rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Empty Candidate Pool */}
        {!isLoading && !error && candidates.length === 0 && (
          <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--surface-raised)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              No eligible candidates found in the pool yet.
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              More developers joining this hackathon will appear here automatically!
            </p>
          </div>
        )}

        {/* Candidates List */}
        {!isLoading && candidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Found {candidates.length} Best Matches
              </span>
              <button
                onClick={fetchTeammates}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ↻ Re-run AI Matching
              </button>
            </div>

            {candidates.map((cand) => {
              const isInvited = invitedUserIds[cand.user.id];
              const isCharterOpen = charterCandidateId === cand.user.id;
              const initials = (cand.user.name || cand.user.username).slice(0, 2).toUpperCase();

              return (
                <div
                  key={cand.user.id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '16px',
                    padding: '20px',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {/* Candidate Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                    {cand.user.avatarUrl ? (
                      <Image
                        src={cand.user.avatarUrl}
                        alt={cand.user.username}
                        width={48}
                        height={48}
                        style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-mid)', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f3a6b, #1e1b26)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: '#c4b5fd',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {cand.user.name || cand.user.username}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          @{cand.user.username}
                        </span>
                        <span
                          style={{
                            marginLeft: 'auto',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.25)',
                            color: '#34d399',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          {cand.compatibilityScore}% Compatibility
                        </span>
                      </div>

                      {/* Roles & Stack */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {cand.user.roleTags?.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(192,132,252,0.1)',
                              border: '1px solid rgba(192,132,252,0.2)',
                              color: '#c084fc',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {cand.user.primaryStack && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            • {cand.user.primaryStack}
                          </span>
                        )}
                      </div>

                      {/* AI Match Reason */}
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.45 }}>
                        💡 <strong>Why Match:</strong> {cand.matchReason}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Charter Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => setCharterCandidateId(isCharterOpen ? null : cand.user.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isCharterOpen ? '#c084fc' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      📜 {isCharterOpen ? 'Hide AI Team Charter ▲' : 'View AI Team Charter ▼'}
                    </button>

                    <button
                      type="button"
                      disabled={isInvited || sendingInviteId === cand.user.id}
                      onClick={() => handleSendInvite(cand)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: isInvited ? 'rgba(52,211,153,0.15)' : 'var(--text-primary)',
                        border: isInvited ? '1px solid rgba(52,211,153,0.3)' : 'none',
                        color: isInvited ? '#34d399' : 'var(--bg-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: isInvited ? 'default' : 'pointer',
                        opacity: sendingInviteId === cand.user.id ? 0.7 : 1,
                      }}
                    >
                      {isInvited ? 'Invite Sent ✓' : sendingInviteId === cand.user.id ? 'Sending...' : 'Send Team Invite →'}
                    </button>
                  </div>

                  {/* Tailored AI Team Charter Card */}
                  {isCharterOpen && cand.teamCharter && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'var(--surface-raised)',
                        border: '1px solid rgba(192,132,252,0.2)',
                      }}
                    >
                      <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c084fc', margin: '0 0 10px' }}>
                        📋 AI-Generated Team Charter Draft
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Shared Vision:</strong> {cand.teamCharter.visionStatement}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Role Complementarity:</strong> {cand.teamCharter.roleComplementarity}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Availability Agreement:</strong> {cand.teamCharter.availabilityAgreement}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Communication Protocol:</strong> {cand.teamCharter.communicationProtocol}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>Commitment Promise:</strong> {cand.teamCharter.commitmentPromise}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
