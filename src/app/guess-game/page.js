'use client';
import GuessWord from '@/components/GuessWord';
import GameBoard from '@/components/GameBoard';

const Game = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <GameBoard />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <GuessWord />
      </div>
    </div>
  );
};

export default Game;