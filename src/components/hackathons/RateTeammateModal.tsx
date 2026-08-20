'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TeammateToRate {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Props {
  teamId: string;
  hackathonTitle?: string;
  ratee: TeammateToRate;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RateTeammateModal({
  teamId,
  hackathonTitle,
  ratee,
  onClose,
  onSuccess,
}: Props) {
  const [deliveredScore, setDeliveredScore] = useState<number>(5);
  const [communicationScore, setCommunicationScore] = useState<number>(5);
  const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean>(true);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          rateeId: ratee.id,
          deliveredScore,
          communicationScore,
          wouldWorkAgain,
          comment: comment.trim() || undefined,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.message || 'Failed to submit peer rating');
      }
    } catch {
      setError('Network error submitting rating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = ratee.name || ratee.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
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
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#34d399', textTransform: 'uppercase' }}>
              ⭐ Peer Commitment Rating
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>
              Rate Teammate: {displayName}
            </h2>
            {hackathonTitle && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                For {hackathonTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Teammate profile banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--surface-raised)',
            padding: '12px 16px',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}
        >
          {ratee.avatarUrl ? (
            <Image
              src={ratee.avatarUrl}
              alt={ratee.username}
              width={42}
              height={42}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: '0.9rem',
              }}
            >
              {initials}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              @{ratee.username}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Delivered Score */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Execution & Delivery Score (1–5)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setDeliveredScore(score)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: '10px',
                    border: deliveredScore === score ? '1px solid #34d399' : '1px solid var(--border)',
                    background: deliveredScore === score ? 'rgba(52,211,153,0.15)' : 'var(--bg-primary)',
                    color: deliveredScore === score ? '#34d399' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ★ {score}
                </button>
              ))}
            </div>
          </div>

          {/* Communication Score */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Communication & Responsiveness Score (1–5)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setCommunicationScore(score)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: '10px',
                    border: communicationScore === score ? '1px solid #c084fc' : '1px solid var(--border)',
                    background: communicationScore === score ? 'rgba(192,132,252,0.15)' : 'var(--bg-primary)',
                    color: communicationScore === score ? '#c084fc' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ★ {score}
                </button>
              ))}
            </div>
          </div>

          {/* Would Work Again */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Would you work with {displayName} again on future projects?
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setWouldWorkAgain(true)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: wouldWorkAgain ? '1px solid #34d399' : '1px solid var(--border)',
                  background: wouldWorkAgain ? 'rgba(52,211,153,0.15)' : 'var(--bg-primary)',
                  color: wouldWorkAgain ? '#34d399' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                👍 Yes (+5 bonus points)
              </button>
              <button
                type="button"
                onClick={() => setWouldWorkAgain(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: !wouldWorkAgain ? '1px solid #f87171' : '1px solid var(--border)',
                  background: !wouldWorkAgain ? 'rgba(248,113,113,0.15)' : 'var(--bg-primary)',
                  color: !wouldWorkAgain ? '#f87171' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                👎 No
              </button>
            </div>
          </div>

          {/* Optional Comment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Feedback Comment (Anonymized & Confidential)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Delivered frontend components early, super responsive in daily updates..."
              rows={3}
              style={{
                width: '100%',
                borderRadius: '10px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-primary)',
                padding: '10px 12px',
                fontSize: '0.82rem',
                resize: 'none',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
              🔒 Comments are shown anonymously on profiles after double-blind unlock or window expiry.
            </p>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #34d399, #059669)',
                border: 'none',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isSubmitting ? 'wait' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
