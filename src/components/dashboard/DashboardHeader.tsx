'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { UserProfile, NotificationDto } from '@/lib/api/types';

interface Props {
  user: UserProfile;
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

export default function DashboardHeader({ user, title, subtitle, onMobileMenuToggle }: Props) {
  const avatarInitials = (user.name || user.username).slice(0, 2).toUpperCase();

  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsLoadingNotifs(true);
    try {
      const res = await fetch('/api/users/me/notifications');
      if (res.ok) {
        const data: NotificationDto[] = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 15s to keep count fresh
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read && !n.readAt).length;

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/users/me/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)),
      );
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const handleRespondToInvite = async (
    notificationId: string,
    hackathonId: string,
    inviteId: string,
    action: 'accept' | 'decline',
  ) => {
    setRespondingInviteId(inviteId);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await handleMarkRead(notificationId);
        fetchNotifications();
        if (action === 'accept') {
          window.location.href = `/hackathons/${hackathonId}`;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || `Failed to ${action} invite.`);
      }
    } catch {
      alert(`Error responding to invite.`);
    } finally {
      setRespondingInviteId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .dash-mobile-hamburger { display: flex !important; }
        }
        @media (min-width: 768px) {
          .dash-mobile-hamburger { display: none !important; }
        }
      `}</style>

      {/* Title & subtitle + Mobile hamburger toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onMobileMenuToggle && (
          <button
            className="dash-mobile-hamburger"
            onClick={onMobileMenuToggle}
            aria-label="Open navigation menu"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border-mid)',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title || 'Dashboard Overview'}
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            {subtitle || 'Monitor commitment metrics, GitHub signals, and AI interview summary.'}
          </p>
        </div>
      </div>

      {/* Header Right Actions: Notification Bell + User info widget */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }} ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
          onClick={() => setShowNotifications((prev) => !prev)}
          title="Notifications"
          style={{
            position: 'relative',
            width: '42px',
            height: '42px',
            borderRadius: '99px',
            background: 'var(--surface)',
            border: '1px solid var(--border-mid)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#f87171',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(248,113,113,0.6)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Panel Dropdown */}
        {showNotifications && (
          <div
            style={{
              position: 'absolute',
              top: '52px',
              right: 0,
              width: '380px',
              maxWidth: '90vw',
              background: 'var(--surface-raised, #161616)',
              border: '1px solid var(--border-mid, rgba(255,255,255,0.12))',
              borderRadius: '18px',
              boxShadow: '0 20px 48px rgba(0,0,0,0.7)',
              zIndex: 1000,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <button
                onClick={fetchNotifications}
                disabled={isLoadingNotifs}
                style={{ background: 'transparent', border: 'none', color: '#c084fc', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {isLoadingNotifs ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {/* Notification List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.read && !notif.readAt;
                  const isTeamInvite = notif.type === 'team_invite';
                  const charter = notif.payload?.charterJson;

                  return (
                    <div
                      key={notif.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isUnread ? 'rgba(192,132,252,0.06)' : 'var(--surface)',
                        border: isUnread ? '1px solid rgba(192,132,252,0.2)' : '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>
                            {isTeamInvite ? '🤝' : notif.type === 'invite_accepted' ? '✓' : notif.type === 'invite_declined' ? '✕' : '🔔'}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: isUnread ? 700 : 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                            {notif.payload?.message || notif.message || (isTeamInvite ? 'Team Invite Received' : 'Notification')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      {/* Attached Team Charter Preview for team_invite */}
                      {isTeamInvite && charter && (
                        <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#c084fc' }}>🎯 Vision: {charter.visionStatement}</p>
                          <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Commitment: {charter.availabilityAgreement || 'Standard daily commitment'}
                          </p>
                        </div>
                      )}

                      {/* Action buttons for team_invite */}
                      {isTeamInvite && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <button
                            onClick={() =>
                              handleRespondToInvite(
                                notif.id,
                                notif.payload.hackathonId,
                                notif.payload.inviteId,
                                'accept',
                              )
                            }
                            disabled={respondingInviteId === notif.payload?.inviteId}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#34d399',
                              border: 'none',
                              color: '#000000',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {respondingInviteId === notif.payload?.inviteId ? 'Joining…' : 'Accept & Join Team'}
                          </button>
                          <button
                            onClick={() =>
                              handleRespondToInvite(
                                notif.id,
                                notif.payload.hackathonId,
                                notif.payload.inviteId,
                                'decline',
                              )
                            }
                            disabled={respondingInviteId === notif.payload?.inviteId}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User info widget */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border-mid)',
            padding: '6px 14px 6px 8px',
            borderRadius: '99px',
          }}
        >
          {user.avatarUrl ? (
            <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={36}
                height={36}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#34d399',
                  border: '2px solid var(--surface)',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #4f3a6b, #1e1b26)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#c4b5fd',
              }}
            >
              {avatarInitials}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user.name || user.username}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 500, lineHeight: 1.2 }}>
              ● GitHub Verified
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
