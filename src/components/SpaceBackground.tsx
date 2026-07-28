'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────────────────────
   Autonomous drift sequence
   Each phase: { dx, dy } direction (unit-ish) + duration in ms
   Pattern: left 3s → stop 1s → right 3s → stop 1s →
            up 3s   → stop 1s → down 3s   → stop 1s  (loops)
───────────────────────────────────────────────────────────── */
const DRIFT_SEQUENCE = [
  { dx: -1, dy:  0, ms: 3000 }, // left
  { dx:  0, dy:  0, ms: 1000 }, // pause
  { dx:  1, dy:  0, ms: 3000 }, // right
  { dx:  0, dy:  0, ms: 1000 }, // pause
  { dx:  0, dy:  1, ms: 3000 }, // up
  { dx:  0, dy:  0, ms: 1000 }, // pause
  { dx:  0, dy: -1, ms: 3000 }, // down
  { dx:  0, dy:  0, ms: 1000 }, // pause
] as const;

const DRIFT_SPEED   = 1.4;   // world-units of target offset per full phase
const MOUSE_WEIGHT  = 1.2;   // max mouse parallax amplitude (world units)
const LERP_CAMERA   = 0.028; // camera smoothing factor

/* ─── Camera rig: mouse parallax + autonomous orbit drift ─── */
function CameraRig() {
  const { camera } = useThree();

  /* Mouse */
  const mouse = useRef({ x: 0, y: 0 });

  /* Drift state */
  const driftTarget   = useRef({ x: 0, y: 0 }); // where the drift wants the camera
  const phaseIndex    = useRef(0);
  const phaseStart    = useRef(performance.now());

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  useFrame(() => {
    const now = performance.now();
    const phase = DRIFT_SEQUENCE[phaseIndex.current];

    /* Advance phase if its duration has elapsed */
    if (now - phaseStart.current >= phase.ms) {
      phaseIndex.current = (phaseIndex.current + 1) % DRIFT_SEQUENCE.length;
      phaseStart.current = now;
    }

    const current = DRIFT_SEQUENCE[phaseIndex.current];
    const elapsed  = now - phaseStart.current;
    const progress = Math.min(elapsed / current.ms, 1); // 0..1 within phase

    /* Ease in-out for smooth acceleration / deceleration */
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    driftTarget.current.x = current.dx * DRIFT_SPEED * eased;
    driftTarget.current.y = current.dy * DRIFT_SPEED * eased;

    /* Combined target = drift + mouse parallax */
    const targetX = driftTarget.current.x + mouse.current.x * MOUSE_WEIGHT;
    const targetY = driftTarget.current.y + mouse.current.y * MOUSE_WEIGHT;

    camera.position.x += (targetX - camera.position.x) * LERP_CAMERA;
    camera.position.y += (targetY - camera.position.y) * LERP_CAMERA;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Orbital particle system ─── */
interface OrbitalParticle {
  a: number;       // semi-major axis
  b: number;       // semi-minor axis
  speed: number;   // radians / frame
  angle: number;
  incl: number;    // inclination
  tiltZ: number;
  colorIdx: number;
  active: boolean;
  dormant: number;
}

/* Grey-white palette — strictly no colour */
const COLORS = [
  new THREE.Color('#4a4a4a'), // mid grey
  new THREE.Color('#2e2e2e'), // dark grey
  new THREE.Color('#6e6e6e'), // light grey
  new THREE.Color('#3a3a3a'), // grey
  new THREE.Color('#555555'), // medium grey
  new THREE.Color('#888888'), // bright grey
  new THREE.Color('#222222'), // near-black
];

const N_PARTICLES    = 80;
const BATCH_INTERVAL = 90;

function OrbitalParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mouseVelocity = useRef({ x: 0, y: 0 });
  const lastMouse     = useRef({ x: 0, y: 0 });
  const frame         = useRef(0);

  const particles = useMemo<OrbitalParticle[]>(() =>
    Array.from({ length: N_PARTICLES }, (_, i) => ({
      a:        3 + Math.random() * 8,
      b:        1.5 + Math.random() * 5,
      speed:    (0.002 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1),
      angle:    Math.random() * Math.PI * 2,
      incl:     (Math.random() - 0.5) * Math.PI * 0.7,
      tiltZ:    Math.random() * Math.PI * 2,
      colorIdx: i % COLORS.length,
      active:   false,
      dormant:  Math.floor(Math.random() * BATCH_INTERVAL * N_PARTICLES),
    }))
  , []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouseVelocity.current.x = e.clientX - lastMouse.current.x;
      mouseVelocity.current.y = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setTimeout(() => {
        mouseVelocity.current.x *= 0.6;
        mouseVelocity.current.y *= 0.6;
      }, 100);
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color  = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    frame.current++;

    if (frame.current % BATCH_INTERVAL === 0) {
      const dormant = particles.filter(p => !p.active);
      if (dormant.length > 0) {
        const pick = dormant[Math.floor(Math.random() * dormant.length)];
        pick.active  = true;
        pick.dormant = 0;
      }
    }

    const mvx = mouseVelocity.current.x * 0.015;
    const mvy = mouseVelocity.current.y * 0.015;

    particles.forEach((p, i) => {
      if (!p.active) {
        dummy.position.set(9999, 9999, 9999);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        return;
      }

      p.angle += p.speed;

      const ex = p.a * Math.cos(p.angle);
      const ey = p.b * Math.sin(p.angle);

      const cosI = Math.cos(p.incl), sinI = Math.sin(p.incl);
      const cosZ = Math.cos(p.tiltZ), sinZ = Math.sin(p.tiltZ);

      const rotX = ex * cosZ - ey * sinI * sinZ;
      const rotY = ex * sinZ + ey * sinI * cosZ;
      const rotZ = ey * cosI;

      dummy.position.set(rotX + mvx, rotY - mvy, rotZ);
      dummy.scale.setScalar(0.06 + Math.abs(Math.sin(p.angle * 3)) * 0.04);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.copy(COLORS[p.colorIdx]);
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, N_PARTICLES]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

/* ─── Public component ─── */
export default function SpaceBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0a' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.1} />
        <Stars
          radius={80}
          depth={60}
          count={6000}
          factor={3}
          saturation={0}
          fade
          speed={0.4}
        />
        <OrbitalParticles />
        <CameraRig />
      </Canvas>
    </div>
  );
}
