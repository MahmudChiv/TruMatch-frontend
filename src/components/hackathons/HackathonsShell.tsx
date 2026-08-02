'use client';

import { useState, useMemo } from 'react';
import type { UserProfile, HackathonSummary, VenueType } from '@/lib/api/types';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import HackathonCard from '@/components/hackathons/HackathonCard';
import SubmitHackathonModal from '@/components/hackathons/SubmitHackathonModal';

interface Props {
  user: UserProfile;
  initialHackathons: HackathonSummary[];
}

export default function HackathonsShell({ user: initialUser, initialHackathons }: Props) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [hackathons, setHackathons] = useState<HackathonSummary[]>(initialHackathons);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState<VenueType | 'all'>('all');

  // Location request state
  const [isLocating, setIsLocating] = useState(false);
  const [locationPromptDismissed, setLocationPromptDismissed] = useState(false);

  const refreshHackathons = async () => {
    try {
      const res = await fetch('/api/hackathons', { cache: 'no-store' });
      if (res.ok) {
        const fresh: HackathonSummary[] = await res.json();
        setHackathons(fresh);
      }
    } catch (e) {
      console.error('Failed to refresh hackathons:', e);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const res = await fetch('/api/users/me/location', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
          });

          if (res.ok) {
            setUser((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            await refreshHackathons();
          }
        } catch (err) {
          console.error('Failed to update location:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation denied or failed:', error);
        setIsLocating(false);
        setLocationPromptDismissed(true);
      }
    );
  };

  const handleJoinToggle = async (id: string, currentlyJoined: boolean) => {
    // Optimistic update
    setHackathons((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              hasJoined: !currentlyJoined,
              joinCount: currentlyJoined ? Math.max(0, h.joinCount - 1) : h.joinCount + 1,
            }
          : h
      )
    );

    try {
      const res = await fetch(`/api/hackathons/${id}/join`, {
        method: currentlyJoined ? 'DELETE' : 'POST',
      });
      if (!res.ok) {
        // Rollback
        await refreshHackathons();
      }
    } catch {
      await refreshHackathons();
    }
  };

  const handleVouch = async (id: string) => {
    try {
      const res = await fetch(`/api/hackathons/${id}/vouch`, { method: 'POST' });
      if (res.ok) {
        await refreshHackathons();
      }
    } catch (e) {
      console.error('Failed to vouch:', e);
    }
  };

  const handleReport = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/hackathons/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await refreshHackathons();
      }
    } catch (e) {
      console.error('Failed to report:', e);
    }
  };

  // Filtered lists
  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      const matchesSearch =
        searchQuery === '' ||
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.description && h.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.locationLabel && h.locationLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        h.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesVenue = venueFilter === 'all' || h.venueType === venueFilter;

      return matchesSearch && matchesVenue;
    });
  }, [hackathons, searchQuery, venueFilter]);

  // Group into proximity tiers
  const sameCity = useMemo(
    () => filteredHackathons.filter((h) => h.distanceTier === 'same_city'),
    [filteredHackathons]
  );
  const sameCountry = useMemo(
    () => filteredHackathons.filter((h) => h.distanceTier === 'same_country'),
    [filteredHackathons]
  );
  const elsewhere = useMemo(
    () => filteredHackathons.filter((h) => h.distanceTier === 'elsewhere'),
    [filteredHackathons]
  );

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* 1. Sidebar */}
      <DashboardSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Content */}
      <div
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <main
          style={{
            flex: 1,
            padding: '28px 32px 48px',
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Top Header Bar */}
          <DashboardHeader user={user} />

          {/* Location Request Prompt Banner (If coordinates not saved yet) */}
          {user.latitude == null && !locationPromptDismissed && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-mid)',
                borderRadius: '14px',
                padding: '14px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>📍</span>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Discover Hackathons Near You
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Enable location to group hackathons by proximity (city & country level).
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setLocationPromptDismissed(true)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
                <button
                  onClick={handleRequestLocation}
                  disabled={isLocating}
                  style={{
                    background: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#0a0a0a',
                    cursor: isLocating ? 'wait' : 'pointer',
                  }}
                >
                  {isLocating ? 'Detecting…' : 'Enable Location'}
                </button>
              </div>
            </div>
          )}

          {/* Action Row: Search + Filters + Add Hackathon CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '28px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              {/* Search input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, city, or tag..."
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />

              {/* Venue filter */}
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value as VenueType | 'all')}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Venues</option>
                <option value="virtual">Virtual</option>
                <option value="physical">Physical</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              style={{
                background: 'var(--text-primary)',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#0a0a0a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>+</span> Submit Hackathon
            </button>
          </div>

          {/* ── TIER 1: SAME CITY / NEAR YOU ── */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              🌆 Near You (Same City)
            </h3>

            {sameCity.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {sameCity.map((h) => (
                  <HackathonCard
                    key={h.id}
                    hackathon={h}
                    onJoinToggle={handleJoinToggle}
                    onVouch={handleVouch}
                    onReport={handleReport}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px border-dashed var(--border)',
                  borderRadius: '14px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  No events or hackathons near you yet — be the first to add one!
                </p>
              </div>
            )}
          </section>

          {/* ── TIER 2: SAME COUNTRY ── */}
          {user.latitude != null && (
            <section style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                🚩 In Your Country / Region
              </h3>

              {sameCountry.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {sameCountry.map((h) => (
                    <HackathonCard
                      key={h.id}
                      hackathon={h}
                      onJoinToggle={handleJoinToggle}
                      onVouch={handleVouch}
                      onReport={handleReport}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px border-dashed var(--border)',
                    borderRadius: '14px',
                    padding: '32px 20px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    No regional events found matching your criteria.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* ── TIER 3: EVERYWHERE & VIRTUAL ── */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              🌐 Virtual & Global Events
            </h3>

            {elsewhere.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {elsewhere.map((h) => (
                  <HackathonCard
                    key={h.id}
                    hackathon={h}
                    onJoinToggle={handleJoinToggle}
                    onVouch={handleVouch}
                    onReport={handleReport}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px border-dashed var(--border)',
                  borderRadius: '14px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  No global or virtual events found matching your criteria.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <SubmitHackathonModal
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => refreshHackathons()}
        />
      )}
    </div>
  );
}
