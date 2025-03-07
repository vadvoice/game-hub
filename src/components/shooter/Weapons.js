'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import { 
  Html, 
  Float, 
  MeshWobbleMaterial, 
  Sparkles, 
  Text, 
  Billboard, 
  useTexture,
  PointMaterial
} from '@react-three/drei';
import useGameStore from '@/utils/gameStore';

// Weapon types with different properties
export const WEAPON_TYPES = {
  pistol: {
    damage: 25,
    fireRate: 0.5,
    color: '#555555',
    glowColor: '#3498db',
    scale: [0.2, 0.15, 0.4],
    ammoPerPickup: 15,
    displayName: 'Pistol',
    texture: '/textures/weapon_pistol.png',
    floatIntensity: 0.5,
    wobbleSpeed: 1,
    wobbleFactor: 0.1,
    sparkleCount: 10,
    sparkleSize: 0.3,
    sparkleSpeed: 0.2,
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M528 56c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 8L32 64C14.3 64 0 78.3 0 96L0 208c0 17.7 14.3 32 32 32l10 0c20.8 0 36.1 19.6 31 39.8L33 440.2c-2.4 9.6-.2 19.7 5.8 27.5S54.1 480 64 480l96 0c14.7 0 27.5-10 31-24.2L217 352l104.5 0c23.7 0 44.8-14.9 52.7-37.2L400.9 240l31.1 0c8.5 0 16.6-3.4 22.6-9.4L477.3 208l66.7 0c17.7 0 32-14.3 32-32l0-80c0-17.7-14.3-32-32-32l-16 0 0-8zM321.4 304L229 304l16-64 105 0-21 58.7c-1.1 3.2-4.2 5.3-7.5 5.3zM80 128l384 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L80 160c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>
  },
  shotgun: {
    damage: 80,
    fireRate: 1,
    color: '#8B4513',
    glowColor: '#e74c3c',
    scale: [0.25, 0.15, 0.6],
    ammoPerPickup: 8,
    displayName: 'Shotgun',
    texture: '/textures/weapon_shotgun.png',
    floatIntensity: 0.7,
    wobbleSpeed: 0.8,
    wobbleFactor: 0.15,
    sparkleCount: 15,
    sparkleSize: 0.4,
    sparkleSpeed: 0.3,
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M49.1 353.8L26.5 365.1C2.8 376.9-6.8 405.8 5.1 429.5s40.7 33.3 64.4 21.5L92 439.7c42.7 41.2 108.3 53.2 164.4 25.1c6.1-3.2 14.8-8.1 25.4-14.5C265.5 427 256 398.6 256 368c0-79.5 64.5-144 144-144c52.4 0 98.3 28 123.5 69.9c32.9-21.9 62.9-41.9 86-57.4c26.7-17.9 35.7-52.7 21.4-81.5L600.2 93.5c-14.4-28.7-47.7-42.4-78-31.8C414.8 99.3 177.1 183.2 127.6 207.2c-56.1 28-85.9 87.7-78.5 146.6zM400 480a112 112 0 1 0 0-224 112 112 0 1 0 0 224zm0-144a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>
  },
  rifle: {
    damage: 40,
    fireRate: 0.2,
    color: '#444444',
    glowColor: '#2ecc71',
    scale: [0.2, 0.15, 0.8],
    ammoPerPickup: 30,
    displayName: 'Rifle',
    texture: '/textures/weapon_rifle.png',
    floatIntensity: 0.6,
    wobbleSpeed: 1.2,
    wobbleFactor: 0.08,
    sparkleCount: 12,
    sparkleSize: 0.35,
    sparkleSpeed: 0.25,
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M192 64l96 0 0-8c0-13.3 10.7-24 24-24s24 10.7 24 24l0 240c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-.4L188.6 494.3c-7.9 15.8-27.1 22.2-42.9 14.3l-80-40c-15.8-7.9-22.2-27.1-14.3-42.9L120.2 288l-8.2 0C50.1 288 0 237.9 0 176C0 131.3 26.2 92.8 64 74.8l0-50.2C64 11 75 0 88.6 0c4.8 0 9.6 1.4 13.6 4.1L192 64zm200 0c13.3 0 24 10.7 24 24l0 56 60.9 0 77.1-30.9c4.9-2 10.5-1.4 14.9 1.6s7 7.9 7 13.2l0 96c0 5.3-2.6 10.3-7 13.2s-10 3.6-14.9 1.6L476.9 208 416 208l0 56c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-176c0-13.3 10.7-24 24-24zM136 176a24 24 0 1 0 -48 0 24 24 0 1 0 48 0zm72 24a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/></svg>
  },
};

// Particles component for weapon pickup effect
function PickupParticles({ color, count = 20 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ],
      size: Math.random() * 0.1 + 0.05
    }));
  }, [count]);

  return (
    <group>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size, 8, 8]} />
          <PointMaterial
            color={color}
            size={particle.size * 10}
            sizeAttenuation
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// Custom glow effect using a larger transparent mesh
function CustomGlow({ color, scale = 1.2, strength = 0.5 }) {
  return (
    <mesh scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={strength} 
        depthWrite={false}
      />
    </mesh>
  );
}

// Weapon pickup component
function WeaponPickup({ position, type, onPickup }) {
  const weaponRef = useRef();
  const [isActive, setIsActive] = useState(true);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const [showPickupPrompt, setShowPickupPrompt] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  
  const playerPosition = useGameStore((state) => state.playerPosition);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  
  // Get weapon texture using drei's useTexture hook
  const weaponTexture = useTexture(WEAPON_TYPES[type].texture);
  
  // Animation and player proximity check
  useFrame((state) => {
    if (!weaponRef.current || !isActive || isPaused || isGameOver) return;
    
    // Check if player is near
    const playerPos = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
    const weaponPos = new Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(weaponPos);
    
    const isNear = distance < 3;
    if (isNear !== isNearPlayer) {
      setIsNearPlayer(isNear);
      setShowPickupPrompt(isNear);
    }
    
    // Pulse effect when player is near
    if (isNear) {
      setPulseIntensity(Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.5);
    } else {
      setPulseIntensity(0);
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
        <Float 
          speed={1.5} 
          rotationIntensity={0.2} 
          floatIntensity={WEAPON_TYPES[type].floatIntensity}
        >
          {/* Weapon model */}
          <group>
            {/* Custom glow effect when player is near */}
            {isNearPlayer && (
              <CustomGlow 
                color={WEAPON_TYPES[type].glowColor} 
                scale={1.5} 
                strength={0.2 + pulseIntensity * 0.3}
              />
            )}
            
            <mesh castShadow receiveShadow>
              <boxGeometry args={WEAPON_TYPES[type].scale} />
              <MeshWobbleMaterial 
                color={WEAPON_TYPES[type].color} 
                emissive={isNearPlayer ? WEAPON_TYPES[type].glowColor : "#000000"}
                emissiveIntensity={isNearPlayer ? 0.5 + pulseIntensity : 0}
                map={weaponTexture}
                factor={WEAPON_TYPES[type].wobbleFactor} 
                speed={WEAPON_TYPES[type].wobbleSpeed}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            
            {/* Sparkles around weapon */}
            <Sparkles 
              count={WEAPON_TYPES[type].sparkleCount} 
              scale={1.5} 
              size={WEAPON_TYPES[type].sparkleSize} 
              speed={WEAPON_TYPES[type].sparkleSpeed} 
              color={WEAPON_TYPES[type].glowColor}
              opacity={isNearPlayer ? 0.8 : 0.4}
            />
            
            {/* Weapon name floating above */}
            <Billboard
              position={[0, 0.8, 0]}
              follow={true}
              lockX={false}
              lockY={false}
              lockZ={false}
            >
              <Text
                fontSize={0.15}
                color={WEAPON_TYPES[type].glowColor}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
              >
                {WEAPON_TYPES[type].displayName}
              </Text>
            </Billboard>
            
            {/* Particles around weapon */}
            <PickupParticles color={WEAPON_TYPES[type].glowColor} count={10} />
          </group>
        </Float>
        
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
      
      {/* Pickup prompt */}
      {showPickupPrompt && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm whitespace-nowrap flex items-center gap-2">
            <span className="inline-block w-6 h-6 bg-white text-black rounded-full flex items-center justify-center font-bold">E</span>
            <span>Pick up {WEAPON_TYPES[type].displayName}</span>
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
      id: `weapon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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