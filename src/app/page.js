'use client';

import { useState } from 'react';
import LetterGlitch from '@/components/LetterGlitch';
import Title from '@/components/Title';
import CallToActionButton from '@/components/CallToActionButton';
import { useRouter } from 'next/navigation';
import TextContent from '@/components/TextContent';
import Tabs from '@/components/Tabs';
import { games } from '@/utils/constants';

export default function Home() {
  const router = useRouter();
  const [currentGame, setCurrentGame] = useState(games[0]);

  const handleGameChange = (index) => {
    setCurrentGame(games[index]);
  };

  return (
    <div className="flex flex-col font-[family-name:var(--font-geist-sans)] h-screen">
      <main className="flex flex-col flex-1 relative">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
        <div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col gap-4 justify-center items-center">
          <Tabs words={games.map((game) => game.title)} onChange={handleGameChange} manualMode={true} />

          <div id='guess-game' className='flex flex-col gap-4 justify-center items-center'>
            <Title
              text="Welcome on the board!"
              className="text-2xl font-semibold text-center text-white"
              delay={150}
              animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
              animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
              easing="easeOutCubic"
              threshold={0.2}
              rootMargin="-50px"
            />

            <CallToActionButton text="Play now" onClick={() => router.push(currentGame.path)} />
            <div className='w-1/2 text-center'>
              <TextContent
                text={currentGame.description}
                disabled={false}
                speed={3}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
