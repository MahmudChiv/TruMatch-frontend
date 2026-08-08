'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type {
  HackathonSummary,
  VenueType,
  ExtractionResult,
  OgScrapeResult,
  ImageExtractionResult,
  CreateHackathonPayload,
} from '@/lib/api/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Which of the three submission paths the user has selected */
type SubmissionPath = 'url' | 'image' | 'manual' | null;

/**
 * The shared review form state — populated by extraction (Path A/B) or entered manually (Path C).
 * All fields are optional so partial extraction works without blocking submission.
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

// ─── Helper: low-confidence field warning icon ──────────────────────────────

/**
 * Renders an inline ⚠ warning icon for a field that Gemini extracted with low certainty.
 * Shown next to the field label, with a tooltip prompting the user to verify.
 */
function LowConfidenceIcon({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      title="AI was uncertain about this field — please verify before publishing"
      style={{
        marginLeft: '6px',
        fontSize: '0.72rem',
        color: '#f59e0b',
        cursor: 'help',
        verticalAlign: 'middle',
      }}
    >
      ⚠ verify
    </span>
  );
}

// ─── Helper: shared input/textarea styles ────────────────────────────────────

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
 * AI-assisted hackathon submission modal.
 *
 * Supports three distinct input paths that all converge in a shared review-before-publish form:
 * - Path A (URL):   Pastes an event URL → server scrapes OG tags + Gemini text extraction
 * - Path B (Image): Uploads a flyer image or pastes raw text → Gemini multimodal/text extraction
 * - Path C (Manual): Skips extraction; user fills all fields themselves
 *
 * Low-confidence fields extracted by Gemini are flagged with a ⚠ warning icon.
 * Neither path auto-publishes — all submissions go through the existing pending→vouch pipeline.
 */
export default function SubmitHackathonModal({
  onClose,
  onSuccess,
  onJoinDuplicate,
}: Props) {
  // ── Navigation state ──────────────────────────────────────────────────────
  /** Step 1: path selection; Step 2: path-specific input + extraction; Step 3: review form */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [path, setPath] = useState<SubmissionPath>(null);

  // ── Path A (URL) state ────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [duplicateMatch, setDuplicateMatch] = useState<HackathonSummary | null>(null);

  // ── Path B (Image/Text) state ─────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPasteToggle, setShowPasteToggle] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Extraction metadata (passed back to POST /hackathons on submit) ────────
  const [rawSourceText, setRawSourceText] = useState<string | null>(null);
  const [storedImagePath, setStoredImagePath] = useState<string | null>(null);
  /** Field names flagged by Gemini as low-confidence — drives ⚠ icons in the form */
  const [lowConfidenceFields, setLowConfidenceFields] = useState<string[]>([]);

  // ── Shared review form state ──────────────────────────────────────────────
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

  /** Updates a single field in the shared review form state */
  const setField = (key: keyof ReviewForm, value: string | VenueType | Array<{ place: string; prize: string }>) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Applies Gemini extraction results to the review form.
   * Only populates fields where the extracted value is non-null and non-empty.
   * Existing form values are never overwritten by null extractions.
   */
  const applyExtraction = (
    extracted: ExtractionResult | null,
    ogTitle?: string | null,
    ogDescription?: string | null,
    ogLogoUrl?: string | null,
  ) => {
    if (!extracted && !ogTitle) return;

    setForm((prev) => ({
      ...prev,
      title: extracted?.title || ogTitle || prev.title,
      externalUrl: extracted?.externalUrl || prev.externalUrl,
      logoUrl: ogLogoUrl || prev.logoUrl,
      shortDescription: extracted?.shortDescription || ogDescription || prev.shortDescription,
      fullDescription: extracted?.fullDescription || prev.fullDescription,
      eligibility: extracted?.eligibility || prev.eligibility,
      teamSize: extracted?.teamSize || prev.teamSize,
      prizePoolTotal: extracted?.prizePoolTotal || prev.prizePoolTotal,
      prizeBreakdown: extracted?.prizeBreakdown?.length ? extracted.prizeBreakdown : prev.prizeBreakdown,
      startDate: extracted?.startDate || prev.startDate,
      endDate: extracted?.endDate || prev.endDate,
      submissionDeadline: extracted?.submissionDeadline || prev.submissionDeadline,
      applicationDeadline: extracted?.applicationDeadline || prev.applicationDeadline,
      locationLabel: extracted?.locationLabel || prev.locationLabel,
      venueType: (extracted?.venueType as VenueType) || prev.venueType,
      tagsInput: extracted?.tags?.length ? extracted.tags.join(', ') : prev.tagsInput,
    }));

    // Store low-confidence field names for ⚠ icon rendering in the review form
    setLowConfidenceFields(extracted?.low_confidence_fields ?? []);
  };

  /** Returns true if fieldName is in the Gemini low-confidence list */
  const isLowConfidence = (fieldName: string) =>
    lowConfidenceFields.includes(fieldName);

  // ── Path A Handler ─────────────────────────────────────────────────────────

  /**
   * Handles Path A (URL) extraction.
   * POSTs to /api/hackathons/scrape which runs OG scraping + Gemini text extraction.
   * On duplicate found: shows the duplicate card.
   * On success: applies extracted data to form and advances to Step 3.
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
        setScrapeError(data.error || 'Failed to fetch the event URL');
        return;
      }

      // Duplicate guard: if an existing listing matches, show the duplicate card
      if (data.duplicate) {
        setDuplicateMatch(data.duplicate);
        return;
      }

      // Store rawSourceText to pass back on final submission (stored admin-only server-side)
      setRawSourceText(data.rawSourceText);

      // Apply Gemini extraction results + OG fallbacks to the review form
      applyExtraction(data.extracted, data.title, data.description, data.logoUrl);

      // Also pre-fill the URL in the form since Path A always has a URL
      setField('externalUrl', urlInput.trim());

      setStep(3);
    } catch {
      // Graceful fallback: network error still allows manual entry in Step 3
      setScrapeError('Network error while fetching. You can continue manually.');
      setStep(3);
    } finally {
      setIsScraping(false);
    }
  };

  // ── Path B Handler ─────────────────────────────────────────────────────────

  /**
   * Handles Path B (image or pasted text) extraction.
   * Sends FormData with optional image file and/or pastedText to /api/hackathons/extract-image.
   * Gemini performs multimodal OCR (image) or text extraction (pasted text).
   * On success: applies extracted data to form and advances to Step 3.
   */
  const handleExtractImageOrText = async () => {
    if (!imageFile && !pastedText.trim()) {
      setExtractError('Please upload an image or paste some text first.');
      return;
    }

    setIsExtracting(true);
    setExtractError('');

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (pastedText.trim()) {
        formData.append('pastedText', pastedText.trim());
      }

      const res = await fetch('/api/hackathons/extract-image', {
        method: 'POST',
        body: formData,
      });

      const data: ImageExtractionResult & { error?: string } = await res.json();

      if (!res.ok) {
        setExtractError(data.error || 'Extraction failed. You can continue and fill fields manually.');
        setStep(3);
        return;
      }

      // Store admin-only passthrough fields
      setRawSourceText(data.rawSourceText);
      if (data.imageStoragePath) {
        setStoredImagePath(data.imageStoragePath);
      }

      // Apply Gemini extraction results to the review form
      applyExtraction(data.extracted);

      setStep(3);
    } catch {
      // Graceful fallback: extraction failure must never block submission
      setExtractError('Extraction failed. You can still fill in the fields manually.');
      setStep(3);
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Final Submit Handler ───────────────────────────────────────────────────

  /**
   * Final submission handler — common to all three paths.
   * Assembles the complete payload from the review form and POSTs to /api/hackathons.
   * rawSourceText and imageUrl are included as admin-only passthrough fields.
   * On success: closes modal and notifies the parent.
   */
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');

    // Parse comma-separated tags into clean lowercase array
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload: CreateHackathonPayload = {
      title: form.title.trim(),
      extractionSource: path || 'manual',
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
      // Admin-only passthrough fields — stored server-side, never returned to public API
      rawSourceText: rawSourceText || undefined,
      imageUrl: storedImagePath || undefined,
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
              {step === 1 ? 'Submit an Event / Hackathon' :
               step === 2 ? (path === 'url' ? '🔗 Paste Event URL' : path === 'image' ? '📸 Upload Flyer / Paste Text' : '✍️ Manual Entry') :
               'Review & Publish'}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Step {step} of {path === 'manual' ? 2 : 3}
              {step === 3 && lowConfidenceFields.length > 0 && (
                <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                  ⚠ {lowConfidenceFields.length} field{lowConfidenceFields.length > 1 ? 's' : ''} need verification
                </span>
              )}
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
        {/* STEP 1: Path Selection                                    */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              How do you want to submit this event? AI will auto-extract event details from your chosen source.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Path A: URL */}
              <button
                type="button"
                onClick={() => { setPath('url'); setStep(2); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-mid)')}
              >
                <span style={{ fontSize: '1.6rem' }}>🔗</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Paste a URL</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    We'll fetch the page and use AI to extract dates, prizes, eligibility, and more.
                  </div>
                </div>
              </button>

              {/* Path B: Image */}
              <button
                type="button"
                onClick={() => { setPath('image'); setStep(2); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-mid)')}
              >
                <span style={{ fontSize: '1.6rem' }}>📸</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Upload a Flyer / Paste Text</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Upload a screenshot or WhatsApp flyer. Or paste raw announcement text. AI reads it directly.
                  </div>
                </div>
              </button>

              {/* Path C: Manual */}
              <button
                type="button"
                onClick={() => { setPath('manual'); setStep(3); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span style={{ fontSize: '1.6rem' }}>✍️</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enter Manually</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Skip AI extraction and fill in all details yourself.
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Path A: URL Input + AI extraction                */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 2 && path === 'url' && (
          <form onSubmit={handleFetchUrl}>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Event URL <span style={{ color: '#f87171' }}>*</span>
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
                AI will fetch the page and extract event details — you can review and edit everything before publishing.
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
                  <button type="button" onClick={() => { setDuplicateMatch(null); setStep(3); }}
                    style={{ padding: '10px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                    Continue anyway
                  </button>
                </div>
              </div>
            )}

            {!duplicateMatch && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button type="submit" disabled={isScraping || !urlInput.trim()}
                  style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--text-primary)', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '0.85rem', cursor: isScraping ? 'wait' : 'pointer', opacity: isScraping ? 0.7 : 1 }}>
                  {isScraping ? '✨ Extracting with AI…' : 'Fetch & Extract →'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Path B: Image / Pasted text + AI extraction      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 2 && path === 'image' && (
          <div>
            {/* Image upload area */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Upload a Flyer Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-mid)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: imageFile ? 'rgba(52,211,153,0.04)' : 'var(--bg-primary)',
                  transition: 'border-color 0.15s',
                  borderColor: imageFile ? '#34d399' : 'var(--border-mid)',
                }}
                onMouseEnter={e => { if (!imageFile) (e.currentTarget.style.borderColor = 'var(--text-muted)'); }}
                onMouseLeave={e => { if (!imageFile) (e.currentTarget.style.borderColor = 'var(--border-mid)'); }}
              >
                {imagePreviewUrl ? (
                  <div>
                    <Image
                      src={imagePreviewUrl}
                      alt="Flyer preview"
                      width={180}
                      height={120}
                      unoptimized
                      style={{ borderRadius: '8px', objectFit: 'cover', maxHeight: '120px', width: 'auto' }}
                    />
                    <p style={{ fontSize: '0.76rem', color: '#34d399', marginTop: '8px' }}>
                      ✓ {imageFile?.name}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Click to upload a flyer, screenshot, or poster
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      PNG, JPG, WEBP · Max 10MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setImagePreviewUrl(url);
                  } else {
                    setImagePreviewUrl(null);
                  }
                }}
              />
            </div>

            {/* Paste text toggle */}
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setShowPasteToggle((v) => !v)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                {showPasteToggle ? '▾ Hide pasted text' : '▸ Or paste announcement text instead'}
              </button>

              {showPasteToggle && (
                <div style={{ marginTop: '10px' }}>
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste a WhatsApp message, LinkedIn post, email announcement, or any event description here…"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    AI will read this text to extract event details. You'll review everything before publishing.
                  </p>
                </div>
              )}
            </div>

            {extractError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.82rem', marginBottom: '14px' }}>
                {extractError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button type="button" onClick={() => setStep(1)}
                style={{ padding: '10px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                ← Back
              </button>
              <button
                type="button"
                disabled={isExtracting || (!imageFile && !pastedText.trim())}
                onClick={handleExtractImageOrText}
                style={{ padding: '10px 22px', borderRadius: '10px', background: 'var(--text-primary)', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '0.85rem', cursor: (isExtracting || (!imageFile && !pastedText.trim())) ? 'not-allowed' : 'pointer', opacity: (isExtracting || (!imageFile && !pastedText.trim())) ? 0.6 : 1 }}>
                {isExtracting ? '✨ Extracting with AI…' : 'Extract with AI →'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 3: Review & Edit Form (all paths converge here)      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <form onSubmit={handleSubmitForm}>
            {submitError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: '0.82rem', marginBottom: '16px' }}>
                {submitError}
              </div>
            )}

            {/* AI extraction notice */}
            {lowConfidenceFields.length > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: '0.8rem', marginBottom: '16px' }}>
                ⚠ AI extraction was uncertain about some fields (marked below). Please double-check those before publishing.
              </div>
            )}

            {/* ── Title (required) */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Event Title <span style={{ color: '#f87171' }}>*</span>
                <LowConfidenceIcon show={isLowConfidence('title')} />
              </label>
              <input type="text" required value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Global AI Hackathon 2026" style={inputStyle} />
            </div>

            {/* ── External URL */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Official Event URL
                <LowConfidenceIcon show={isLowConfidence('externalUrl')} />
              </label>
              <input type="url" value={form.externalUrl} onChange={(e) => setField('externalUrl', e.target.value)} placeholder="https://devpost.com/hackathons/example (leave blank if not yet available)" style={inputStyle} />
              {!form.externalUrl && path === 'image' && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  No URL found — will show as "Website not yet available" on the listing.
                </p>
              )}
            </div>

            {/* ── Short Description */}
            {(path !== 'manual' || form.shortDescription) && (
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Short Description
                  <LowConfidenceIcon show={isLowConfidence('shortDescription')} />
                </label>
                <textarea rows={2} value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="One-line summary of the event" style={{ ...inputStyle, resize: 'none' }} />
              </div>
            )}

            {/* ── Full Description */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Full Description
                <LowConfidenceIcon show={isLowConfidence('fullDescription')} />
              </label>
              <textarea rows={4} value={form.fullDescription} onChange={(e) => setField('fullDescription', e.target.value)} placeholder="Full event description, theme, goals, sponsors, etc." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* ── Eligibility & Team Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>
                  Eligibility
                  <LowConfidenceIcon show={isLowConfidence('eligibility')} />
                </label>
                <input type="text" value={form.eligibility} onChange={(e) => setField('eligibility', e.target.value)} placeholder="e.g. Open to all" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  Team Size
                  <LowConfidenceIcon show={isLowConfidence('teamSize')} />
                </label>
                <input type="text" value={form.teamSize} onChange={(e) => setField('teamSize', e.target.value)} placeholder="e.g. 2–4 members" style={inputStyle} />
              </div>
            </div>

            {/* ── Venue Type & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>
                  Venue Type
                  <LowConfidenceIcon show={isLowConfidence('venueType')} />
                </label>
                <select value={form.venueType} onChange={(e) => setField('venueType', e.target.value as VenueType)} style={inputStyle}>
                  <option value="virtual">Virtual</option>
                  <option value="physical">Physical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  City Location
                  <LowConfidenceIcon show={isLowConfidence('locationLabel')} />
                </label>
                <input type="text" value={form.locationLabel} onChange={(e) => setField('locationLabel', e.target.value)} placeholder="e.g. Lagos, Nigeria" style={inputStyle} />
              </div>
            </div>

            {/* ── Start & End Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>
                  Start Date
                  <LowConfidenceIcon show={isLowConfidence('startDate')} />
                </label>
                <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  End Date
                  <LowConfidenceIcon show={isLowConfidence('endDate')} />
                </label>
                <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ── Application & Submission Deadlines */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>
                  Application Deadline
                  <LowConfidenceIcon show={isLowConfidence('applicationDeadline')} />
                </label>
                <input type="date" value={form.applicationDeadline} onChange={(e) => setField('applicationDeadline', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>
                  Submission Deadline
                  <LowConfidenceIcon show={isLowConfidence('submissionDeadline')} />
                </label>
                <input type="date" value={form.submissionDeadline} onChange={(e) => setField('submissionDeadline', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ── Prize Pool */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Prize Pool Total
                <LowConfidenceIcon show={isLowConfidence('prizePoolTotal')} />
              </label>
              <input type="text" value={form.prizePoolTotal} onChange={(e) => setField('prizePoolTotal', e.target.value)} placeholder="e.g. ₦1,000,000 or $50,000 in credits" style={inputStyle} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Stored exactly as written — not parsed.</p>
            </div>

            {/* ── Prize Breakdown (read-only display if AI extracted it) */}
            {form.prizeBreakdown.length > 0 && (
              <div style={fieldStyle}>
                <label style={labelStyle}>
                  Prize Breakdown
                  <LowConfidenceIcon show={isLowConfidence('prizeBreakdown')} />
                </label>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-mid)', fontSize: '0.82rem' }}>
                  {form.prizeBreakdown.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < form.prizeBreakdown.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.place}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.prize}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tags */}
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Tags (comma-separated)
                <LowConfidenceIcon show={isLowConfidence('tags')} />
              </label>
              <input type="text" value={form.tagsInput} onChange={(e) => setField('tagsInput', e.target.value)} placeholder="ai, web3, climate, mobile" style={inputStyle} />
            </div>

            {/* ── Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={() => { if (path === 'manual') setStep(1); else setStep(2); }}
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
