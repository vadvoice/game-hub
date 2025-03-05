'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading from '@/components/Loading';

// Dynamically import the game component with no SSR
const ShooterGame = dynamic(() => import('@/components/ShooterGame'), {
  ssr: false,
  loading: () => <Loading message="Loading 3D Shooter Game..." />
});

export default function ShooterGamePage() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 relative">
        <Suspense fallback={<Loading message="Loading 3D Shooter Game..." />}>
          <ShooterGame />
        </Suspense>
      </div>
      <div className="bg-gray-900 text-white p-2 text-center text-sm">
        <p>WASD to move | Mouse to look | Left Click to shoot | E to pick up weapons | ESC to pause</p>
      </div>
    </main>
  );
}
