'use client';

import LetterGlitch from '../components/LetterGlitch';
import Title from '../components/Title';
import CallToActionButton from '../components/CallToActionButton';
import { useRouter } from 'next/navigation';
import TextContent from '@/components/TextContent';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col font-[family-name:var(--font-geist-sans)] h-screen">
      <header className="row-start-1 flex gap-6 flex-wrap items-center justify-center">
      </header>
      <main className="flex flex-col flex-1 relative">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
        <div className="absolute bottom-0 left-0 right-0 top-0 flex flex-col gap-4 justify-center items-center">
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

          <CallToActionButton text="Play now" onClick={() => router.push('/game')} />

          <div className='w-1/2 text-center'>
            <TextContent
              text="Try to guess the word based on the first letter and a hint. Each correct guess brings you closer to victory!"
              disabled={false}
              speed={3}
            />
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
