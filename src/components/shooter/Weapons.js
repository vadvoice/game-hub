'use client';

import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import useGameStore from '@/utils/gameStore';

// Weapon types with different properties
const WEAPON_TYPES = {
  pistol: {
    damage: 25,
    fireRate: 0.5,
    color: '#555555',
    scale: [0.2, 0.15, 0.4],
    ammoPerPickup: 15,
    displayName: 'Pistol',
  },
  shotgun: {
    damage: 80,
    fireRate: 1,
    color: '#8B4513',
    scale: [0.25, 0.15, 0.6],
    ammoPerPickup: 8,
    displayName: 'Shotgun',
  },
  rifle: {
    damage: 40,
    fireRate: 0.2,
    color: '#444444',
    scale: [0.2, 0.15, 0.8],
    ammoPerPickup: 30,
    displayName: 'Rifle',
  },
};

// Weapon pickup component
function WeaponPickup({ position, type, onPickup }) {
  const weaponRef = useRef();
  const [isActive, setIsActive] = useState(true);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const [showPickupPrompt, setShowPickupPrompt] = useState(false);
  
  const playerPosition = useGameStore((state) => state.playerPosition);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  
  // Floating animation
  useFrame((state) => {
    if (!weaponRef.current || !isActive || isPaused || isGameOver) return;
    
    // Floating animation
    weaponRef.current.setTranslation({
      x: position[0],
      y: position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.5,
      z: position[2],
    });
    
    // Rotation animation
    weaponRef.current.setRotation({
      x: 0,
      y: Math.sin(state.clock.elapsedTime * 0.5),
      z: 0,
      w: Math.cos(state.clock.elapsedTime * 0.5),
    });
    
    // Check distance to player
    if (playerPosition) {
      const pickupPosition = new Vector3(position[0], position[1], position[2]);
      const distance = pickupPosition.distanceTo(playerPosition);
      
      // Update near player state
      const wasNear = isNearPlayer;
      const isNear = distance < 3;
      setIsNearPlayer(isNear);
      
      // Show pickup prompt when player gets close
      if (isNear && !wasNear) {
        setShowPickupPrompt(true);
        setTimeout(() => setShowPickupPrompt(false), 3000);
      }
    }
  });
  
  // Handle player picking up the weapon
  const handlePickup = () => {
    if (!isActive) return;
    setIsActive(false);
    onPickup(type);
  };
  
  // Check for player proximity and key press
  useEffect(() => {
    const checkProximity = (e) => {
      if (e.key === 'e' && isActive && isNearPlayer && !isPaused && !isGameOver) {
        handlePickup();
      }
    };
    
    window.addEventListener('keydown', checkProximity);
    return () => window.removeEventListener('keydown', checkProximity);
  }, [isActive, isNearPlayer, isPaused, isGameOver]);
  
  if (!isActive) return null;
  
  return (
    <>
      <RigidBody
        ref={weaponRef}
        position={position}
        type="fixed"
        colliders={false}
        sensor
      >
        <CuboidCollider args={[1, 1, 1]} />
        <group>
          {/* Weapon model */}
          <mesh castShadow>
            <boxGeometry args={WEAPON_TYPES[type].scale} />
            <meshStandardMaterial 
              color={WEAPON_TYPES[type].color} 
              metalness={0.7} 
              roughness={0.3} 
              emissive={isNearPlayer ? WEAPON_TYPES[type].color : 'black'}
              emissiveIntensity={isNearPlayer ? 0.5 : 0}
            />
          </mesh>
          
          {/* Glow effect */}
          <pointLight 
            position={[0, 0, 0]} 
            intensity={isNearPlayer ? 1.5 : 0.5} 
            color={isNearPlayer ? '#ffffff' : WEAPON_TYPES[type].color} 
            distance={isNearPlayer ? 5 : 3} 
          />
        </group>
      </RigidBody>
      
      {/* Pickup prompt - this would be rendered in HTML overlay in a real implementation */}
      {showPickupPrompt && (
        <Html position={[position[0], position[1] + 1.5, position[2]]}>
          <div className="bg-black bg-opacity-70 text-white p-2 rounded text-center whitespace-nowrap">
            Press E to pick up {WEAPON_TYPES[type].displayName}
          </div>
        </Html>
      )}
    </>
  );
}

// HTML component for overlay text
function Html({ position, children }) {
  // This is a placeholder - in a real implementation, you would use drei's HTML component
  // or implement a proper HTML overlay system
  return null;
}

// Main Weapons component that manages all weapon pickups
export default function Weapons() {
  const [weapons, setWeapons] = useState([]);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const pickupWeapon = useGameStore((state) => state.pickupWeapon);
  const playerPosition = useGameStore((state) => state.playerPosition);
  
  // Spawn a weapon pickup at a random position
  const spawnWeapon = () => {
    if (weapons.length >= 5 || isPaused || isGameOver || !playerPosition) return;
    
    // Random position on the map, but not too close to player
    const angle = Math.random() * Math.PI * 2;
    const minDistance = 10;
    const maxDistance = 40;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    const x = playerPosition.x + Math.sin(angle) * distance;
    const z = playerPosition.z + Math.cos(angle) * distance;
    
    // Random weapon type (excluding pistol as player starts with it)
    const types = ['shotgun', 'rifle'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const newWeapon = {
      id: Date.now() + Math.random(),
      position: [x, 0.5, z],
      type,
    };
    
    setWeapons((prev) => [...prev, newWeapon]);
  };
  
  // Remove weapon when picked up
  const removeWeapon = (id) => {
    setWeapons((prev) => prev.filter((weapon) => weapon.id !== id));
  };
  
  // Handle weapon pickup
  const handlePickup = (id, type) => {
    // Play pickup sound (would be implemented in a real game)
    // playSound('pickup');
    
    // Add weapon to player inventory
    pickupWeapon(type);
    
    // Remove weapon from world
    removeWeapon(id);
    
    // Spawn a new weapon after some time
    setTimeout(() => {
      if (!isPaused && !isGameOver) {
        spawnWeapon();
      }
    }, 10000);
  };
  
  // Spawn weapons periodically
  useEffect(() => {
    if (isPaused || isGameOver) return;
    
    // Initial weapons
    if (weapons.length === 0 && playerPosition) {
      // Spawn initial weapons after a delay
      const initialSpawnTimeout = setTimeout(() => {
        spawnWeapon();
        spawnWeapon();
      }, 5000);
      
      return () => clearTimeout(initialSpawnTimeout);
    }
    
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to spawn a weapon every 20 seconds
        spawnWeapon();
      }
    }, 20000);
    
    return () => clearInterval(interval);
  }, [isPaused, isGameOver, weapons.length, playerPosition]);
  
  return (
    <>
      {weapons.map((weapon) => (
        <WeaponPickup
          key={weapon.id}
          position={weapon.position}
          type={weapon.type}
          onPickup={() => handlePickup(weapon.id, weapon.type)}
        />
      ))}
    </>
  );
} 