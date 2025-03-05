'use client';

import useGameStore from '@/utils/gameStore';

export default function PauseMenu({ onResume }) {
  const togglePause = useGameStore((state) => state.togglePause);
  const resetGame = useGameStore((state) => state.resetGame);
  
  const handleResume = () => {
    togglePause();
    // Call the onResume callback to lock the pointer
    if (onResume) {
      setTimeout(onResume, 100); // Small delay to ensure pause state is updated
    }
  };
  
  const handleRestart = () => {
    resetGame();
    togglePause();
    // Call the onResume callback to lock the pointer
    if (onResume) {
      setTimeout(onResume, 100); // Small delay to ensure pause state is updated
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-gray-800 p-8 rounded-lg text-center">
        <h2 className="text-3xl font-bold text-white mb-6">PAUSED</h2>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={handleResume}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Resume Game
          </button>
          
          <button
            onClick={handleRestart}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Restart Game
          </button>
          
          <div className="mt-4 text-gray-300 text-sm">
            <h3 className="font-bold mb-2">Controls:</h3>
            <ul className="text-left">
              <li>WASD - Move</li>
              <li>Mouse - Look around</li>
              <li>Left Click - Shoot</li>
              <li>E - Pick up weapons</li>
              <li>1,2,3 - Switch weapons</li>
              <li>ESC - Pause/Resume</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 