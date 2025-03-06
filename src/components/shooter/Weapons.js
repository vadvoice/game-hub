'use client';

import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import { Html } from '@react-three/drei';
import useGameStore from '@/utils/gameStore';
import assetLoader from '@/utils/assetLoader';

// Weapon types with different properties
const WEAPON_TYPES = {
  pistol: {
    damage: 25,
    fireRate: 0.5,
    color: '#555555',
    scale: [0.2, 0.15, 0.4],
    ammoPerPickup: 15,
    displayName: 'Pistol',
    texture: '/textures/weapon_pistol.png',
  },
  shotgun: {
    damage: 80,
    fireRate: 1,
    color: '#8B4513',
    scale: [0.25, 0.15, 0.6],
    ammoPerPickup: 8,
    displayName: 'Shotgun',
    texture: '/textures/weapon_shotgun.png',
  },
  rifle: {
    damage: 40,
    fireRate: 0.2,
    color: '#444444',
    scale: [0.2, 0.15, 0.8],
    ammoPerPickup: 30,
    displayName: 'Rifle',
    texture: '/textures/weapon_rifle.png',
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
  
  // Get weapon texture
  const weaponTexture = assetLoader.getTexture(WEAPON_TYPES[type].texture);
  
  // Floating animation
  useFrame((state) => {
    if (!weaponRef.current || !isActive || isPaused || isGameOver) return;
    
    // Floating animation
    weaponRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    
    // Rotation animation
    weaponRef.current.rotation.y += 0.01;
    
    // Check if player is near
    const playerPos = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
    const weaponPos = new Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(weaponPos);
    
    const isNear = distance < 3;
    if (isNear !== isNearPlayer) {
      setIsNearPlayer(isNear);
      setShowPickupPrompt(isNear);
    }
  });
  
  // Handle pickup with E key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyE' && isNearPlayer && isActive && !isPaused && !isGameOver) {
        handlePickup();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNearPlayer, isActive, isPaused, isGameOver]);
  
  const handlePickup = () => {
    if (!isActive) return;
    
    setIsActive(false);
    setShowPickupPrompt(false);
    onPickup(type);
  };
  
  if (!isActive) return null;
  
  return (
    <group position={position}>
      <RigidBody 
        ref={weaponRef} 
        type="fixed" 
        colliders={false}
        position={position}
      >
        <mesh castShadow>
          <boxGeometry args={WEAPON_TYPES[type].scale} />
          <meshStandardMaterial 
            color={WEAPON_TYPES[type].color} 
            emissive={isNearPlayer ? "#ffffff" : "#000000"}
            emissiveIntensity={isNearPlayer ? 0.2 : 0}
            map={weaponTexture}
          />
        </mesh>
        
        <CuboidCollider 
          args={[
            WEAPON_TYPES[type].scale[0] / 2,
            WEAPON_TYPES[type].scale[1] / 2,
            WEAPON_TYPES[type].scale[2] / 2,
          ]} 
          sensor
          onIntersectionEnter={() => setIsNearPlayer(true)}
          onIntersectionExit={() => setIsNearPlayer(false)}
        />
      </RigidBody>
      
      {showPickupPrompt && (
        <Html position={[0, 1, 0]}>
          <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
            Press E to pick up {WEAPON_TYPES[type].displayName}
          </div>
        </Html>
      )}
    </group>
  );
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
    console.log(`Player picked up ${type} weapon with ID ${id}`);
    
    // Add weapon to player's inventory
    pickupWeapon(type);
    
    // Remove weapon from the world
    removeWeapon(id);
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
          onPickup={(type) => handlePickup(weapon.id, type)}
        />
      ))}
    </>
  );
} 