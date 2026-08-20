'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Globe from 'react-globe.gl';

export interface DevPoint {
  lat: number;
  lng: number;
  name: string;
  role: string;
  score: number;
  color: string;
  size: number;
  photoIndex: number;
  photoGender: 'men' | 'women';
}

export interface Arc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

interface GlobeInnerProps {
  pointsData: DevPoint[];
  arcsData: Arc[];
  width?: number;
  height?: number;
}

/* ── Build the HTML string for react-globe.gl's native tooltip ── */
function buildTooltipHTML(dev: DevPoint): string {
  const photoSrc = `https://randomuser.me/api/portraits/${dev.photoGender}/${dev.photoIndex}.jpg`;
  const barW = dev.score;

  return `
    <div style="
      font-family: var(--font-montserrat), 'Montserrat', sans-serif;
      background:rgba(10,10,14,0.97);
      border:1px solid ${dev.color}55;
      border-radius:14px;
      padding:13px 15px 12px;
      box-shadow:0 0 24px ${dev.color}2a,0 8px 32px rgba(0,0,0,0.88);
      backdrop-filter:blur(16px);
      width:200px;
      pointer-events:none;
    ">
      <!-- Row 1: avatar + name/role -->
      <div style="display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;margin-bottom:10px">
        <img
          src="${photoSrc}"
          alt="${dev.name}"
          width="42" height="42"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          style="width:42px;height:42px;border-radius:50%;border:2px solid ${dev.color}88;object-fit:cover;display:block"
        />
        <div style="
          display:none;width:42px;height:42px;border-radius:50%;
          background:${dev.color}22;border:2px solid ${dev.color}88;
          align-items:center;justify-content:center;
          font-size:0.72rem;font-weight:800;color:${dev.color};
        ">
          ${dev.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style="font-size:0.84rem;font-weight:700;color:#f0ece4;line-height:1.2;margin-bottom:2px">${dev.name}</div>
          <div style="font-size:0.68rem;color:#888;line-height:1.3">${dev.role}</div>
        </div>
      </div>

      <!-- Row 2: label + badge -->
      <div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:6px;margin-bottom:7px">
        <div style="font-size:0.64rem;color:#666;letter-spacing:0.04em;text-transform:uppercase">Commitment Score</div>
        <div style="
          background:${dev.color}1a;border:1px solid ${dev.color}55;
          border-radius:5px;padding:2px 8px;
          font-size:0.74rem;font-weight:800;color:${dev.color};
        ">${dev.score}</div>
      </div>

      <!-- Row 3: progress bar -->
      <div style="height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden">
        <div style="width:${barW}%;height:100%;background:linear-gradient(90deg,${dev.color}99,${dev.color});border-radius:2px"></div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */
export default function GlobeInner({
  pointsData,
  arcsData,
  width = 580,
  height = 580,
}: GlobeInnerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);

  /* Auto-rotation & camera */
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const timer = setTimeout(() => {
      const controls = globe.controls();
      if (controls) {
        controls.autoRotate      = true;
        controls.autoRotateSpeed = 0.55;
        controls.enableZoom      = false;
        controls.enablePan       = false;
        controls.minPolarAngle   = Math.PI * 0.2;
        controls.maxPolarAngle   = Math.PI * 0.8;
      }
      globe.pointOfView({ altitude: 2.1 }, 0);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  /*
   * Sticky tooltip: react-globe.gl fires onPointHover with the point object
   * when the cursor enters a point, and with `null` when it leaves.
   * We keep a small delay on the "hide" so the tooltip doesn't flicker when
   * moving slightly off the point while the globe is rotating.
   */
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<DevPoint | null>(null);

  const handlePointHover = useCallback((point: object | null) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (point) {
      setHovered(point as DevPoint);
    } else {
      // Delay hiding so the card doesn't vanish when the user barely moves
      hideTimer.current = setTimeout(() => setHovered(null), 400);
    }
  }, []);

  /* Pause auto-rotation while a card is shown (better UX) */
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    if (!controls) return;
    controls.autoRotate = !hovered;
  }, [hovered]);

  return (
    <>
      {/* Inject the tooltip CSS once */}
      <style>{`
        /* react-globe.gl renders its HTML label inside .scene-tooltip */
        .scene-tooltip {
          pointer-events: none !important;
          transition: opacity 0.18s ease !important;
        }
        /* Pulse ring on every globe point */
        @keyframes pointPing {
          0%   { transform: scale(1);   opacity: 0.9; }
          70%  { transform: scale(2.4); opacity: 0;   }
          100% { transform: scale(2.4); opacity: 0;   }
        }
      `}</style>

      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"

        globeImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png"

        atmosphereColor="#a855f7"
        atmosphereAltitude={0.13}
        showAtmosphere={true}

        pointsData={pointsData}
        pointLat={(d) => (d as DevPoint).lat}
        pointLng={(d) => (d as DevPoint).lng}
        pointColor={(d) => (d as DevPoint).color}
        pointRadius={(d) => (d as DevPoint).size}
        pointAltitude={0.025}
        pointResolution={14}
        /* Native HTML tooltip — shown on hover */
        pointLabel={(d) => buildTooltipHTML(d as DevPoint)}
        onPointHover={handlePointHover}

        arcsData={arcsData}
        arcStartLat={(d) => (d as Arc).startLat}
        arcStartLng={(d) => (d as Arc).startLng}
        arcEndLat={(d) => (d as Arc).endLat}
        arcEndLng={(d) => (d as Arc).endLng}
        arcColor={(d: any) => (d as Arc).color}
        arcAltitude={0.26}
        arcStroke={0.55}
        arcDashLength={0.42}
        arcDashGap={0.14}
        arcDashAnimateTime={2600}

        ringsData={pointsData}
        ringLat={(d) => (d as DevPoint).lat}
        ringLng={(d) => (d as DevPoint).lng}
        ringColor={(d: any) => () => (d as DevPoint).color}
        ringMaxRadius={3.2}
        ringPropagationSpeed={2.2}
        ringRepeatPeriod={1100}
      />
    </>
  );
}
