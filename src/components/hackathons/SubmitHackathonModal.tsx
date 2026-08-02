'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { HackathonSummary, VenueType } from '@/lib/api/types';

interface Props {
  onClose: () => void;
  onSuccess: (newHackathon: HackathonSummary) => void;
  onJoinDuplicate?: (duplicateId: string) => void;
}

/**
 * Multi-step modal component for submitting a new hackathon/event entry.
 *
 * Flow:
 * - Step 1: User pastes external URL -> Server-side scraping fetches title, description, and logo.
 *   - Duplicate detection check: If match found, presents "Join existing event pool" option.
 * - Step 2: Auto-populates pre-filled fields. User completes dates, venue type, location, prize info, and tags before publishing.
 */
export default function SubmitHackathonModal({
  onClose,
  onSuccess,
  onJoinDuplicate,
}: Props) {
  // Step state (1: URL & scraping, 2: Details form)
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 states
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [duplicateMatch, setDuplicateMatch] = useState<HackathonSummary | null>(null);

  // Step 2 Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [venueType, setVenueType] = useState<VenueType>('virtual');
  const [locationLabel, setLocationLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [prizeInfo, setPrizeInfo] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /**
   * Step 1 handler: Triggers server-side Open Graph scraping & duplicate check.
   * If a duplicate is detected, displays the duplicate warning card.
   * Otherwise, auto-fills form inputs and advances to Step 2.
   */
  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsScraping(true);
    setScrapeError('');
    setDuplicateMatch(null);

    try {
      const res = await fetch('/api/hackathons/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScrapeError(data.error || 'Failed to scrape event URL');
        return;
      }

      // Check if duplicate entry exists in DB
      if (data.duplicate) {
        setDuplicateMatch(data.duplicate);
        return;
      }

      // Auto-fill scraped fields into Step 2 state
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.logoUrl) setLogoUrl(data.logoUrl);

      setStep(2);
    } catch {
      setScrapeError('Unexpected network error. You can continue manually.');
      setStep(2);
    } finally {
      setIsScraping(false);
    }
  };

  /**
   * Step 2 handler: Validates payload and POSTs new hackathon entry to API.
   * Automatically formats tags array and closes modal upon success.
   */
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !urlInput.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    // Parse comma-separated tags into clean array
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      const res = await fetch('/api/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          externalUrl: urlInput.trim(),
          description: description.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          venueType,
          locationLabel: locationLabel.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          submissionDeadline: submissionDeadline || undefined,
          prizeInfo: prizeInfo.trim() || undefined,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(
          data.message || data.error || 'Failed to create hackathon listing',
        );
        return;
      }

      onSuccess(data);
      onClose();
    } catch {
      setSubmitError('Unexpected error during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: '20px',
          padding: '28px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              Submit an Event / Hackathon
            </h2>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                margin: '4px 0 0',
              }}
            >
              Step {step} of 2 —{' '}
              {step === 1
                ? 'Event URL & Auto-fill'
                : 'Review & Confirm Details'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* STEP 1: Paste URL & Auto-scrape */}
        {step === 1 && (
          <form onSubmit={handleFetchUrl}>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                Event External URL <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://devpost.com/hackathons/example"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <p
                style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  marginTop: '6px',
                }}
              >
                Paste the official landing page URL. We'll automatically scrape
                the title, logo, and description.
              </p>
            </div>

            {scrapeError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                }}
              >
                {scrapeError}
              </div>
            )}

            {/* DUPLICATE WARNING CARD */}
            {duplicateMatch && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-mid)',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  {duplicateMatch.logoUrl && (
                    <Image
                      src={duplicateMatch.logoUrl}
                      alt={duplicateMatch.title}
                      width={36}
                      height={36}
                      unoptimized
                      style={{ borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Duplicate Found
                    </span>
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {duplicateMatch.title}
                    </h4>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    margin: '0 0 14px',
                  }}
                >
                  This hackathon is already listed on TruMatch! You can join the
                  existing event pool instead of creating a duplicate entry.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onJoinDuplicate) onJoinDuplicate(duplicateMatch.id);
                      onClose();
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'var(--text-primary)',
                      border: 'none',
                      color: '#0a0a0a',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Join Existing Event Pool →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateMatch(null);
                      setStep(2);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    Continue anyway
                  </button>
                </div>
              </div>
            )}

            {!duplicateMatch && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScraping || !urlInput.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'var(--text-primary)',
                    border: 'none',
                    color: '#0a0a0a',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: isScraping ? 'wait' : 'pointer',
                  }}
                >
                  {isScraping ? 'Auto-filling details…' : 'Fetch Details →'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 2: Review & Complete Form Details */}
        {step === 2 && (
          <form onSubmit={handleSubmitForm}>
            {submitError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                }}
              >
                {submitError}
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Hackathon Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Global AI Hackathon 2026"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the hackathon theme and goal"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Venue Type & City Location */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Venue Type
                </label>
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value as VenueType)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="virtual">Virtual</option>
                  <option value="physical">Physical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  City Location (City level only)
                </label>
                <input
                  type="text"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Start & End Dates */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-mid)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Prize Info (Display only) */}
            <div style={{ marginBottom: '14px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Prize Info (Display only text)
              </label>
              <input
                type="text"
                value={prizeInfo}
                onChange={(e) => setPrizeInfo(e.target.value)}
                placeholder="e.g. $10,000 in credits & cash prizes"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ai, web3, climate, mobile"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'var(--text-primary)',
                    border: 'none',
                    color: '#0a0a0a',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: isSubmitting ? 'wait' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Publishing…' : 'Publish Listing'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
