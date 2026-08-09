'use client';

import { useState } from 'react';
import Image from 'next/image';
import type {
  HackathonSummary,
  VenueType,
  OgScrapeResult,
  CreateHackathonPayload,
} from '@/lib/api/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * The review form state — pre-filled by OG extraction (URL) and editable by user.
 */
interface ReviewForm {
  title: string;
  externalUrl: string;
  logoUrl: string;
  description: string;
  shortDescription: string;
  fullDescription: string;
  eligibility: string;
  teamSize: string;
  prizePoolTotal: string;
  prizeBreakdown: Array<{ place: string; prize: string }>;
  prizeInfo: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  applicationDeadline: string;
  venueType: VenueType;
  locationLabel: string;
  tagsInput: string; // comma-separated string, parsed on submit
}

interface Props {
  onClose: () => void;
  onSuccess: (newHackathon: HackathonSummary) => void;
  onJoinDuplicate?: (duplicateId: string) => void;
}

// ─── Shared input styles ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border-mid)',
  borderRadius: '8px',
  padding: '9px 12px',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '5px',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '12px',
};

// ─── Main Modal Component ────────────────────────────────────────────────────

/**
 * Open Graph (OG) URL-based hackathon submission modal.
 *
 * Flow:
 * - Step 1: User pastes event URL → server fetches page and extracts OG tags (title, description, logoUrl).
 * - Step 2: User reviews and edits pre-filled fields before publishing.
 */
export default function SubmitHackathonModal({
  onClose,
  onSuccess,
  onJoinDuplicate,
}: Props) {
  // ── Navigation state: Step 1 = Paste URL, Step 2 = Review & Publish ────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── URL & Scraping state ──────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [duplicateMatch, setDuplicateMatch] = useState<HackathonSummary | null>(null);

  // ── Admin source text passthrough ─────────────────────────────────────────
  const [rawSourceText, setRawSourceText] = useState<string | null>(null);

  // ── Review form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<ReviewForm>({
    title: '',
    externalUrl: '',
    logoUrl: '',
    description: '',
    shortDescription: '',
    fullDescription: '',
    eligibility: '',
    teamSize: '',
    prizePoolTotal: '',
    prizeBreakdown: [],
    prizeInfo: '',
    startDate: '',
    endDate: '',
    submissionDeadline: '',
    applicationDeadline: '',
    venueType: 'virtual',
    locationLabel: '',
    tagsInput: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setField = (
    key: keyof ReviewForm,
    value: string | VenueType | Array<{ place: string; prize: string }>
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Handles URL fetching and OG tag extraction.
   * POSTs to /api/hackathons/scrape.
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

      const data: OgScrapeResult & { error?: string } = await res.json();

      if (!res.ok) {
        setScrapeError(data.error || 'Failed to fetch event URL');
        return;
      }

      // Duplicate guard: if an existing listing matches, prompt user
      if (data.duplicate) {
        setDuplicateMatch(data.duplicate);
        return;
      }

      setRawSourceText(data.rawSourceText || null);

      // Pre-fill form from scraped OG metadata
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        externalUrl: urlInput.trim(),
        logoUrl: data.logoUrl || prev.logoUrl,
        shortDescription: data.description || prev.shortDescription,
        description: data.description || prev.description,
      }));

      setStep(2);
    } catch {
      setScrapeError('Network error while fetching URL. You can continue and fill in details manually.');
      setForm((prev) => ({ ...prev, externalUrl: urlInput.trim() }));
      setStep(2);
    } finally {
      setIsScraping(false);
    }
  };

  /**
   * Final submission handler.
   */
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload: CreateHackathonPayload = {
      title: form.title.trim(),
      extractionSource: 'url',
      externalUrl: form.externalUrl.trim() || undefined,
      logoUrl: form.logoUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      shortDescription: form.shortDescription.trim() || undefined,
      fullDescription: form.fullDescription.trim() || undefined,
      eligibility: form.eligibility.trim() || undefined,
      teamSize: form.teamSize.trim() || undefined,
      prizePoolTotal: form.prizePoolTotal.trim() || undefined,
      prizeBreakdown: form.prizeBreakdown.length > 0 ? form.prizeBreakdown : undefined,
      prizeInfo: form.prizeInfo.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      submissionDeadline: form.submissionDeadline || undefined,
      applicationDeadline: form.applicationDeadline || undefined,
      venueType: form.venueType,
      locationLabel: form.locationLabel.trim() || undefined,
      tags,
      rawSourceText: rawSourceText || undefined,
    };

    try {
      const res = await fetch('/api/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || data.error || 'Failed to publish listing');
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {step === 1 ? '🔗 Submit Event URL' : 'Review & Publish Listing'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Step {step} of 2
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '2px' }}
          >
            ✕
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 1: Event URL Input                                    */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <form onSubmit={handleFetchUrl}>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Event Webpage URL <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://devpost.com/hackathons/example"
                style={inputStyle}
              />
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                We'll fetch Open Graph metadata (title, logo, description) to pre-fill the form.
              </p>
            </div>

            {scrapeError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.82rem', marginBottom: '16px' }}>
                {scrapeError}
              </div>
            )}

            {/* Duplicate warning card */}
            {duplicateMatch && (
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-mid)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  {duplicateMatch.logoUrl && (
                    <Image src={duplicateMatch.logoUrl} alt={duplicateMatch.title} width={36} height={36} unoptimized style={{ borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duplicate Found</span>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{duplicateMatch.title}</h4>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                  This event is already listed on TruMatch. You can join the existing event pool instead.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => { if (onJoinDuplicate) onJoinDuplicate(duplicateMatch.id); onClose(); }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--text-primary)', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                    Join Existing Pool →
                  </button>
                  <button type="button" onClick={() => { setDuplicateMatch(null); setStep(2); }}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                    Continue anyway
                  </button>
                </div>
              </div>
            )}

            {!duplicateMatch && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={onClose} style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isScraping || !urlInput.trim()}
                  style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--text-primary)', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '0.85rem', cursor: isScraping ? 'wait' : 'pointer', opacity: isScraping ? 0.7 : 1 }}>
                  {isScraping ? 'Fetching Details…' : 'Fetch Details →'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 2: Review & Publish Form                              */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleSubmitForm}>
            {submitError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.82rem', marginBottom: '16px' }}>
                {submitError}
              </div>
            )}

            {/* ── Title (required) */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Event Title <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input type="text" required value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Global AI Hackathon 2026" style={inputStyle} />
            </div>

            {/* ── External URL */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Official Event URL
              </label>
              <input type="url" value={form.externalUrl} onChange={(e) => setField('externalUrl', e.target.value)} placeholder="https://devpost.com/hackathons/example" style={inputStyle} />
            </div>

            {/* ── Logo URL */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Event Logo / Image URL
              </label>
              <input type="url" value={form.logoUrl} onChange={(e) => setField('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" style={inputStyle} />
            </div>

            {/* ── Short Description */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Short Description
              </label>
              <textarea rows={2} value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="One-line summary of the event" style={{ ...inputStyle, resize: 'none' }} />
            </div>

            {/* ── Full Description */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Full Description
              </label>
              <textarea rows={4} value={form.fullDescription} onChange={(e) => setField('fullDescription', e.target.value)} placeholder="Full event description, theme, goals, sponsors, etc." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* ── Eligibility & Team Size */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Eligibility</label>
                <input type="text" value={form.eligibility} onChange={(e) => setField('eligibility', e.target.value)} placeholder="e.g. Open to all" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Team Size</label>
                <input type="text" value={form.teamSize} onChange={(e) => setField('teamSize', e.target.value)} placeholder="e.g. 2–4 members" style={inputStyle} />
              </div>
            </div>

            {/* ── Venue Type & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Venue Type</label>
                <select value={form.venueType} onChange={(e) => setField('venueType', e.target.value as VenueType)} style={inputStyle}>
                  <option value="virtual">Virtual</option>
                  <option value="physical">Physical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>City Location</label>
                <input type="text" value={form.locationLabel} onChange={(e) => setField('locationLabel', e.target.value)} placeholder="e.g. Lagos, Nigeria" style={inputStyle} />
              </div>
            </div>

            {/* ── Start & End Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ── Application & Submission Deadlines */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Application Deadline</label>
                <input type="date" value={form.applicationDeadline} onChange={(e) => setField('applicationDeadline', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Submission Deadline</label>
                <input type="date" value={form.submissionDeadline} onChange={(e) => setField('submissionDeadline', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ── Prize Pool */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Prize Pool Total</label>
              <input type="text" value={form.prizePoolTotal} onChange={(e) => setField('prizePoolTotal', e.target.value)} placeholder="e.g. ₦1,000,000 or $50,000" style={inputStyle} />
            </div>

            {/* ── Tags */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input type="text" value={form.tagsInput} onChange={(e) => setField('tagsInput', e.target.value)} placeholder="ai, web3, climate, mobile" style={inputStyle} />
            </div>

            {/* ── Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setStep(1)}
                style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                ← Back
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={onClose}
                  style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !form.title.trim()}
                  style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--text-primary)', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '0.85rem', cursor: (isSubmitting || !form.title.trim()) ? 'not-allowed' : 'pointer', opacity: (isSubmitting || !form.title.trim()) ? 0.6 : 1 }}>
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

