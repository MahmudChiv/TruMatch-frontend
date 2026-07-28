'use client';

import dynamic from 'next/dynamic';

const SpaceBackground = dynamic(
  () => import('@/components/SpaceBackground'),
  { ssr: false }
);

export default function SpaceBackgroundLoader() {
  return <SpaceBackground />;
}
