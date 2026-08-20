'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { HackathonDetail, UserProfile } from '@/lib/api/types';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FindTeammatesModal from '@/components/hackathons/FindTeammatesModal';
import RateTeammateModal from '@/components/hackathons/RateTeammateModal';

interface Props {
  user: UserProfile;
  initialHackathon: HackathonDetail;
}

export default function HackathonDetailClient({ user, initialHackathon }: Props) {
  const [hackathon, setHackathon] = useState<HackathonDetail>(initialHackathon);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);

  const handleJoinToggle = async () => {
    setIsJoining(true);
    const currentlyJoined = hackathon.hasJoined;

    // Optimistic
    setHackathon((prev) => ({
      ...prev,
      hasJoined: !currentlyJoined,
      joinCount: currentlyJoined ? Math.max(0, prev.joinCount - 1) : prev.joinCount + 1,
    }));

    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/join`, {
        method: currentlyJoined ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        // Refresh full data
        const freshRes = await fetch(`/api/hackathons/${hackathon.id}`);
        if (freshRes.ok) {
          const freshData: HackathonDetail = await freshRes.json();
          setHackathon(freshData);
        }
      }
    } catch (e) {
      console.error('Failed to toggle join:', e);
    } finally {
      setIsJoining(false);
    }
  };

  const [pendingInvite, setPendingInvite] = useState<any | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [showAcceptSuccessModal, setShowAcceptSuccessModal] = useState(false);

  const [rateeToRate, setRateeToRate] = useState<any | null>(null);
  const [isCompletingTeam, setIsCompletingTeam] = useState(false);
  const [completingSuccessMessage, setCompletingSuccessMessage] = useState('');

  const handleCompleteTeam = async () => {
    if (!hackathon.myTeam) return;
    setIsCompletingTeam(true);
    setCompletingSuccessMessage('');
    try {
      const res = await fetch(`/api/teams/${hackathon.myTeam.id}/complete`, {
        method: 'POST',
      });
      if (res.ok) {
        setCompletingSuccessMessage('Team marked complete! Rating notifications sent to all members.');
        const freshRes = await fetch(`/api/hackathons/${hackathon.id}`);
        if (freshRes.ok) {
          const freshData: HackathonDetail = await freshRes.json();
          setHackathon(freshData);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to complete team.');
      }
    } catch {
      alert('Error marking team as complete.');
    } finally {
      setIsCompletingTeam(false);
    }
  };

  const fetchPendingInvite = async () => {
    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/my-invite`);
      if (res.ok) {
        const data = await res.json();
        setPendingInvite(data);
      }
    } catch (e) {
      console.error('Failed to fetch pending invite:', e);
    }
  };

  useEffect(() => {
    fetchPendingInvite();
  }, [hackathon.id]);

  const handleRespondToInvite = async (action: 'accept' | 'decline') => {
    if (!pendingInvite) return;
    setIsResponding(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/invites/${pendingInvite.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setPendingInvite(null);
        if (action === 'accept') {
          setShowAcceptSuccessModal(true);
        }
        // Refresh hackathon details
        const freshRes = await fetch(`/api/hackathons/${hackathon.id}`);
        if (freshRes.ok) {
          const freshData: HackathonDetail = await freshRes.json();
          setHackathon(freshData);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || `Failed to ${action} invite.`);
      }
    } catch {
      alert(`Error responding to invite.`);
    } finally {
      setIsResponding(false);
    }
  };

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <style>{`
        @media (min-width: 768px) and (max-width: 1024px) {
          .hack-detail-main-container { margin-left: 64px !important; }
        }
        @media (max-width: 767px) {
          .hack-detail-main-container { margin-left: 0 !important; }
          .hack-detail-main-content { padding: 16px 16px 36px !important; }
        }
      `}</style>

      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className="hack-detail-main-container"
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <main
          className="hack-detail-main-content"
          style={{
            flex: 1,
            padding: '28px 32px 48px',
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <DashboardHeader user={user} onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

          {/* Back link */}
          <a
            href="/hackathons"
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '20px',
            }}
          >
            ← Back to Hackathons
          </a>

          {/* Hero Banner Box */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: '20px',
              padding: '28px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '14px',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {hackathon.logoUrl && !imageError ? (
                    <Image
                      src={hackathon.logoUrl}
                      alt={hackathon.title}
                      width={64}
                      height={64}
                      unoptimized
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    hackathon.title.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {hackathon.title}
                    </h1>
                    {hackathon.status === 'verified' && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '99px',
                          background: 'rgba(52, 211, 153, 0.1)',
                          border: '1px solid rgba(52, 211, 153, 0.25)',
                          color: '#34d399',
                        }}
                      >
                        ✓ Verified Event
                      </span>
                    )}
                  </div>

                  {hackathon.locationLabel && (
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                      📍 {hackathon.locationLabel} • <span style={{ textTransform: 'capitalize' }}>{hackathon.venueType}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Top CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {hackathon.externalUrl ? (
                  <a
                    href={hackathon.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    Register on Official Site ↗
                  </a>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Website not yet available
                  </span>
                )}

                <button
                  onClick={handleJoinToggle}
                  disabled={isJoining}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: hackathon.hasJoined ? 'rgba(52, 211, 153, 0.15)' : 'var(--text-primary)',
                    border: hackathon.hasJoined ? '1px solid rgba(52, 211, 153, 0.3)' : 'none',
                    color: hackathon.hasJoined ? '#34d399' : '#0a0a0a',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: isJoining ? 'wait' : 'pointer',
                  }}
                >
                  {hackathon.hasJoined ? 'Joined Pool ✓' : isJoining ? '…' : 'Join Event Pool'}
                </button>

                {hackathon.hasJoined && (
                  <button
                    onClick={() => setShowMatchingModal(true)}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                    }}
                  >
                    🤖 Find Teammates
                  </button>
                )}
              </div>
            </div>

            {showMatchingModal && (
              <FindTeammatesModal
                hackathonId={hackathon.id}
                hackathonTitle={hackathon.title}
                onClose={() => setShowMatchingModal(false)}
              />
            )}

            {/* Pending Team Invite & Charter Banner */}
            {pendingInvite && (
              <div
                style={{
                  marginTop: '24px',
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(192, 132, 252, 0.08) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🤝</span>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', color: '#c084fc', textTransform: 'uppercase' }}>
                        Pending Team Invite Received
                      </span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                        {pendingInvite.fromUser?.name || pendingInvite.fromUser?.username} invited you to join their team!
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleRespondToInvite('accept')}
                      disabled={isResponding}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        background: '#34d399',
                        border: 'none',
                        color: '#000000',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      {isResponding ? 'Joining…' : '✓ Accept Team Charter & Join'}
                    </button>
                    <button
                      onClick={() => handleRespondToInvite('decline')}
                      disabled={isResponding}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>

                {/* Team Charter Details */}
                {pendingInvite.charterJson && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '12px',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#c084fc', fontWeight: 700, display: 'block' }}>🎯 Vision Statement</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{pendingInvite.charterJson.visionStatement}</span>
                    </div>
                    <div>
                      <span style={{ color: '#c084fc', fontWeight: 700, display: 'block' }}>🤝 Role Complementarity</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{pendingInvite.charterJson.roleComplementarity}</span>
                    </div>
                    <div>
                      <span style={{ color: '#c084fc', fontWeight: 700, display: 'block' }}>⏰ Availability Agreement</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{pendingInvite.charterJson.availabilityAgreement}</span>
                    </div>
                    <div>
                      <span style={{ color: '#c084fc', fontWeight: 700, display: 'block' }}>💬 Communication Protocol</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{pendingInvite.charterJson.communicationProtocol}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Event Overview / Description */}
            {hackathon.description && (
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '20px', marginBottom: '16px' }}>
                {hackathon.description}
              </p>
            )}

            {/* Key details grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>DATES</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(hackathon.startDate) || 'TBD'} – {formatDate(hackathon.endDate) || 'TBD'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>DEADLINE</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDate(hackathon.submissionDeadline) || 'Not specified'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>PRIZES</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {hackathon.prizeInfo || 'Display text unavailable'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>PARTICIPANTS</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {hackathon.joinCount} developers joined
                </span>
              </div>
            </div>
          </div>

          {/* Team Formation & Participation Section */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: '20px',
              padding: '28px',
              marginBottom: '32px',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              🤝 Team Matching Pool
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              Join this hackathon's pool to get matched with developers by commitment score and skill level.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Find Teammates Button (Disabled Stub) */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  disabled
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  ⚡ Find Teammates (AI Matching)
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Coming Soon
                  </span>
                </button>
              </div>

              {/* Use Previous Team Button (Disabled Stub) */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  disabled
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  🔄 Use a Previous Team
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-light)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Coming Soon
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Team Roster & Contact Hub */}
          {hackathon.myTeam && (
            <div
              id="team-roster-section"
              style={{
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '20px',
                padding: '28px',
                marginBottom: '32px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎉</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Your Team Roster & Contact Hub
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '99px',
                        background: hackathon.myTeam.status === 'complete' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(192, 132, 252, 0.2)',
                        border: hackathon.myTeam.status === 'complete' ? '1px solid #34d399' : '1px solid #c084fc',
                        color: hackathon.myTeam.status === 'complete' ? '#34d399' : '#c084fc',
                        textTransform: 'uppercase',
                      }}
                    >
                      {hackathon.myTeam.status === 'complete' ? 'Team Complete ✓' : 'Team Forming'} ({hackathon.myTeam.members?.length || 1} members)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Reach out to your teammates via email or GitHub to coordinate project architecture and register together.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {hackathon.myTeam.status === 'forming' && (
                    <button
                      onClick={handleCompleteTeam}
                      disabled={isCompletingTeam}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: isCompletingTeam ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      🔒 {isCompletingTeam ? 'Completing...' : 'Mark Team Complete & Rate'}
                    </button>
                  )}

                  {hackathon.externalUrl && (
                    <a
                      href={hackathon.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      Complete Official Registration ↗
                    </a>
                  )}
                </div>
              </div>

              {completingSuccessMessage && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34d399',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    marginBottom: '20px',
                  }}
                >
                  ✓ {completingSuccessMessage}
                </div>
              )}

              {/* Members List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {hackathon.myTeam.members?.map((mem: any) => {
                  const mUser = mem.user;
                  if (!mUser) return null;
                  const isMe = mUser.id === user.id;

                  return (
                    <div
                      key={mUser.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border-mid)',
                        borderRadius: '16px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-raised)', flexShrink: 0 }}>
                          {mUser.avatarUrl ? (
                            <Image src={mUser.avatarUrl} alt={mUser.username} width={44} height={44} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#c084fc' }}>
                              {(mUser.name || mUser.username).slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {mUser.name || mUser.username}
                            </span>
                            {isMe && <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>You</span>}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>@{mUser.username}</span>
                        </div>

                        <div style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)', color: '#c084fc', fontSize: '0.74rem', fontWeight: 700 }}>
                          ⚡ {Math.round(mUser.commitmentScore || 0)}
                        </div>
                      </div>

                      {/* Stack & Role Tags */}
                      {(mUser.roleTags?.length > 0 || mUser.primaryStack) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {mUser.roleTags?.map((tag: string) => (
                            <span key={tag} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Contact Details */}
                      <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {mUser.email || `${mUser.username}@users.noreply.github.com`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          {mUser.email && (
                            <a
                              href={`mailto:${mUser.email}?subject=TruMatch%20Team%20Coordination%20-%20${encodeURIComponent(hackathon.title)}`}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'rgba(52, 211, 153, 0.15)',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                color: '#34d399',
                                textDecoration: 'none',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                              }}
                            >
                              ✉️ Email Teammate
                            </a>
                          )}
                          <a
                            href={`https://github.com/${mUser.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'var(--surface-raised)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            GitHub ↗
                          </a>

                          {!isMe && hackathon.myTeam?.status === 'complete' && (
                            <button
                              onClick={() => setRateeToRate(mUser)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 700,
                                fontSize: '0.74rem',
                                cursor: 'pointer',
                              }}
                            >
                              ⭐ Rate Teammate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participant Roster */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: '20px',
              padding: '28px',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              👥 Pool Participants ({hackathon.participants ? hackathon.participants.length : 0})
            </h3>

            {hackathon.participants && hackathon.participants.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '14px',
                }}
              >
                {hackathon.participants.map((p) => (
                  <a
                    key={p.id}
                    href={`/users/${p.id}/profile`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--surface-raised)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {p.avatarUrl ? (
                        <Image
                          src={p.avatarUrl}
                          alt={p.username}
                          width={36}
                          height={36}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        p.username.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name || p.username}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        @{p.username}
                      </span>
                    </div>

                    {/* Commitment Score Pill */}
                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {Math.round(p.commitmentScore)}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                No participants in this pool yet. Be the first to join!
              </p>
            )}
          </div>
        </main>
      </div>

      {/* Accept Invite Success Modal */}
      {showAcceptSuccessModal && (
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
          onClick={() => setShowAcceptSuccessModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid #34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 16px',
              }}
            >
              🎉
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Team Invite Accepted!
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '10px' }}>
              You have successfully joined the team for <strong>{hackathon.title}</strong>!
            </p>

            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-mid)',
                borderRadius: '14px',
                padding: '16px',
                margin: '20px 0',
                textAlign: 'left',
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
              }}
            >
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#34d399' }}>
                🚀 Next Steps:
              </p>
              <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Reach out to your teammates via email to coordinate project stack and roles.</li>
                <li>Go ahead and complete your official team registration on the hackathon event site.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hackathon.externalUrl && (
                <a
                  href={hackathon.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowAcceptSuccessModal(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  Complete Official Registration ↗
                </a>
              )}
              <button
                onClick={() => {
                  setShowAcceptSuccessModal(false);
                  document.getElementById('team-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                View Team Roster & Contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {rateeToRate && hackathon.myTeam && (
        <RateTeammateModal
          teamId={hackathon.myTeam.id}
          hackathonTitle={hackathon.title}
          ratee={rateeToRate}
          onClose={() => setRateeToRate(null)}
          onSuccess={async () => {
            setRateeToRate(null);
            setCompletingSuccessMessage('Peer rating submitted! Commitment score updated live.');
            const freshRes = await fetch(`/api/hackathons/${hackathon.id}`);
            if (freshRes.ok) {
              const freshData: HackathonDetail = await freshRes.json();
              setHackathon(freshData);
            }
          }}
        />
      )}
    </div>
  );
}
