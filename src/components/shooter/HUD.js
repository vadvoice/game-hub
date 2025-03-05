'use client';

import { useState, useEffect } from 'react';
import useGameStore from '@/utils/gameStore';

export default function HUD() {
  const health = useGameStore((state) => state.health);
  const score = useGameStore((state) => state.score);
  const currentWeapon = useGameStore((state) => state.currentWeapon);
  const weapons = useGameStore((state) => state.weapons);
  const ammo = useGameStore((state) => state.ammo);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const resetGame = useGameStore((state) => state.resetGame);
  const switchWeapon = useGameStore((state) => state.switchWeapon);
  
  // Damage effect state
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  const [lastHealth, setLastHealth] = useState(health);
  const [showHitMarker, setShowHitMarker] = useState(false);
  const [killFeed, setKillFeed] = useState([]);
  
  // Format weapon name for display
  const formatWeaponName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  // Handle health changes for damage effect
  useEffect(() => {
    if (health < lastHealth) {
      setShowDamageEffect(true);
      setTimeout(() => setShowDamageEffect(false), 300);
    }
    setLastHealth(health);
  }, [health, lastHealth]);
  
  // Handle score changes for kill feed
  useEffect(() => {
    const currentScore = useGameStore.getState().score;
    const previousScore = score;
    
    if (currentScore > previousScore) {
      // Add kill to feed
      const newKill = {
        id: Date.now(),
        weapon: currentWeapon,
        points: currentScore - previousScore,
      };
      
      setKillFeed(prev => [newKill, ...prev].slice(0, 5));
      
      // Show hit marker
      setShowHitMarker(true);
      setTimeout(() => setShowHitMarker(false), 200);
    }
  }, [score, currentWeapon]);
  
  // Handle game over
  useEffect(() => {
    if (isGameOver) {
      // Show game over screen
      // In a real game, you might want to add more functionality here
    }
  }, [isGameOver]);
  
  // Handle game restart
  const handleRestart = () => {
    resetGame();
  };
  
  // Handle weapon switching
  const handleWeaponSwitch = (weapon) => {
    if (weapons.includes(weapon)) {
      switchWeapon(weapon);
    }
  };
  
  // Render crosshair
  const renderCrosshair = () => {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className={`crosshair ${showHitMarker ? 'text-red-500' : 'text-white'}`}>
          <div className="w-1 h-1 rounded-full bg-current"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 w-0.5 h-2 bg-current"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 w-0.5 h-2 bg-current"></div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 h-0.5 w-2 bg-current"></div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 h-0.5 w-2 bg-current"></div>
        </div>
      </div>
    );
  };
  
  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="bg-gray-800 p-8 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-red-500 mb-4">GAME OVER</h2>
          <p className="text-white text-xl mb-2">Final Score: {score}</p>
          <p className="text-gray-300 mb-6">You were overwhelmed by the enemy forces!</p>
          <button
            onClick={handleRestart}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Damage effect overlay */}
      {showDamageEffect && (
        <div className="absolute inset-0 pointer-events-none bg-red-500 bg-opacity-20 z-40 animate-pulse"></div>
      )}
      
      {/* Crosshair */}
      {renderCrosshair()}
      
      {/* Main HUD */}
      <div className="absolute inset-x-0 bottom-12 pointer-events-none">
        <div className="container mx-auto px-4">
          <div className="bg-gray-900 bg-opacity-70 rounded-lg p-4 flex justify-between items-center">
            {/* Health */}
            <div className="flex flex-col items-center">
              <div className="text-white text-sm mb-1">HEALTH</div>
              <div className="w-40 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    health > 60 ? 'bg-green-600' : 
                    health > 30 ? 'bg-yellow-500' : 
                    'bg-red-600'
                  }`}
                  style={{ width: `${health}%` }}
                ></div>
              </div>
              <div className="text-white text-sm mt-1">{health}/100</div>
            </div>
            
            {/* Score */}
            <div className="text-center">
              <div className="text-white text-sm mb-1">SCORE</div>
              <div className="text-white text-2xl font-bold">{score}</div>
            </div>
            
            {/* Weapon & Ammo */}
            <div className="flex flex-col items-center">
              <div className="text-white text-sm mb-1">WEAPON</div>
              <div className="text-white text-lg font-bold">
                {formatWeaponName(currentWeapon)}
              </div>
              <div className={`text-white text-sm mt-1 ${ammo[currentWeapon] < 5 ? 'text-red-500 animate-pulse' : ''}`}>
                Ammo: {ammo[currentWeapon]}
              </div>
            </div>
          </div>
          
          {/* Weapon selection - excluding pistol */}
          <div className="mt-2 flex justify-center gap-2">
            {weapons
              .filter(weapon => weapon !== 'pistol') // Filter out pistol
              .map((weapon) => (
                <button
                  key={weapon}
                  onClick={() => handleWeaponSwitch(weapon)}
                  className={`px-3 py-1 rounded pointer-events-auto ${
                    currentWeapon === weapon
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 bg-opacity-70 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {formatWeaponName(weapon)} ({ammo[weapon]})
                </button>
              ))}
          </div>
          
          {/* Kill feed */}
          <div className="absolute top-4 right-4 w-64">
            {killFeed.map((kill) => (
              <div 
                key={kill.id} 
                className="bg-gray-900 bg-opacity-70 text-white px-3 py-1 rounded mb-1 flex justify-between items-center"
              >
                <span>Enemy killed</span>
                <span className="text-yellow-400">+{kill.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 