'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import { Vector3 } from 'three';
import { 
  useGLTF, 
  Float, 
  MeshDistortMaterial, 
  Sparkles, 
  Trail, 
  Billboard, 
  Text 
} from '@react-three/drei';
import useGameStore from '@/utils/gameStore';

// Enemy types with different properties - moved to a constant outside component
const ENEMY_TYPES = {
  basic: {
    health: 100,
    speed: 3,
    damage: 10,
    points: 10,
    color: 'red',
    scale: 1,
    distort: 0.2,
    floatIntensity: 0.5,
  },
  fast: {
    health: 50,
    speed: 9,
    damage: 5,
    points: 15,
    color: 'orange',
    scale: 0.8,
    distort: 0.4,
    floatIntensity: 1,
  },
  heavy: {
    health: 200,
    speed: 2,
    damage: 20,
    points: 25,
    color: 'darkred',
    scale: 1.2,
    distort: 0.1,
    floatIntensity: 0.3,
  },
};

// Enemy component
function Enemy({ position, type = 'basic', initialHealth, onDeath }) {
  const enemyRef = useRef();
  const trailRef = useRef();
  const [health, setHealth] = useState(initialHealth || ENEMY_TYPES[type].health);
  const [isActive, setIsActive] = useState(true);
  const [isHit, setIsHit] = useState(false);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  
  // Death animation states
  const [isDying, setIsDying] = useState(false);
  const [deathStartTime, setDeathStartTime] = useState(0);
  const [deathDirection, setDeathDirection] = useState(() => new Vector3());
  const [deathRotation, setDeathRotation] = useState({ x: 0, y: 0, z: 0 });
  const [deathScale, setDeathScale] = useState(1);
  
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const takeDamage = useGameStore((state) => state.takeDamage);
  const addScore = useGameStore((state) => state.addScore);
  
  // Handle enemy being hit - memoized with useCallback
  const hit = useCallback((damage) => {
    if (!isActive || isDying) return;
    
    setIsHit(true);
    setTimeout(() => setIsHit(false), 150); // Flash effect
    
    setHealth((prev) => {
      const newHealth = prev - damage;
      if (newHealth <= 0 && isActive) {
        // Start death animation instead of immediately removing
        startDeathAnimation();
        
        // Add score based on enemy type
        const points = ENEMY_TYPES[type].points;
        addScore(points);
      }
      return newHealth;
    });
  }, [isActive, isDying, type, addScore]);
  
  // Start death animation - memoized with useCallback
  const startDeathAnimation = useCallback(() => {
    setIsDying(true);
    setDeathStartTime(Date.now());
    setIsActive(false); // Stop normal behavior
    
    // Calculate random death direction (fall direction)
    const randomAngle = Math.random() * Math.PI * 2;
    setDeathDirection(new Vector3(
      Math.cos(randomAngle) * 0.05,
      0.05, // Small upward force
      Math.sin(randomAngle) * 0.05
    ));
    
    // Random rotation for death animation
    setDeathRotation({
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.1,
      z: (Math.random() - 0.5) * 0.1
    });
  }, []);
  
  // Ensure enemy is positioned correctly on spawn
  useEffect(() => {
    if (enemyRef.current) {
      // Make sure enemy is above ground level
      enemyRef.current.setTranslation({
        x: position[0],
        y: Math.max(1.5, position[1]), // Ensure minimum height of 1.5
        z: position[2]
      });
    }
  }, [position]);
  
  // Set userData.hit when component mounts or hit function changes
  useEffect(() => {
    if (enemyRef.current) {
      enemyRef.current.userData = { 
        ...enemyRef.current.userData,
        type: 'enemy', 
        hit 
      };
    }
  }, [hit]);
  
  // Enemy AI movement and death animation
  useFrame((state, delta) => {
    if (!enemyRef.current) return;
    
    if (isDying) {
      // Handle death animation
      const currentPosition = enemyRef.current.translation();
      const elapsedTime = (Date.now() - deathStartTime) / 1000; // seconds
      
      // Apply gravity to death animation
      deathDirection.y -= 0.01; // Gravity effect
      
      // Move in death direction
      enemyRef.current.setTranslation({
        x: currentPosition.x + deathDirection.x,
        y: Math.max(0.5, currentPosition.y + deathDirection.y), // Don't go below ground
        z: currentPosition.z + deathDirection.z
      });
      
      // Apply death rotation
      const currentRotation = enemyRef.current.rotation();
      enemyRef.current.setRotation({
        x: currentRotation.x + deathRotation.x,
        y: currentRotation.y + deathRotation.y,
        z: currentRotation.z + deathRotation.z,
        w: currentRotation.w
      });
      
      // Scale down enemy during death animation
      setDeathScale(Math.max(0, 1 - elapsedTime)); // Linear scale down over 1 second
      
      // Stop movement after death starts
      enemyRef.current.setLinvel({ x: 0, y: 0, z: 0 });
      
      // Remove enemy when animation completes
      if (elapsedTime > 1) {
        onDeath();
      }
      return;
    }
    
    if (!isActive || isPaused || isGameOver) return;
    
    // Simple AI: move towards player
    if (playerPosition) {
      const enemyPosition = enemyRef.current.translation();
      
      // Ensure enemy stays above ground
      if (enemyPosition.y < 1.0) {
        enemyRef.current.setTranslation({
          x: enemyPosition.x,
          y: 1.0, // Keep at minimum height
          z: enemyPosition.z
        });
      }
      
      // Calculate direction to player
      const direction = new Vector3(
        playerPosition.x - enemyPosition.x,
        0, // Keep y movement at 0 to prevent flying/sinking
        playerPosition.z - enemyPosition.z
      );
      
      // Calculate distance to player
      const distanceToPlayer = direction.length();
      
      // Normalize direction
      if (distanceToPlayer > 0.1) {
        direction.normalize();
      }
      
      // Move towards player if not too close
      if (distanceToPlayer > 2) {
        // Move towards player
        enemyRef.current.setLinvel({
          x: direction.x * ENEMY_TYPES[type].speed,
          y: 0, // Keep vertical velocity at 0 to prevent sinking
          z: direction.z * ENEMY_TYPES[type].speed,
        });
        
        // Rotate to face player
        const angle = Math.atan2(direction.x, direction.z);
        enemyRef.current.setRotation({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) });
      } else {
        // Stop when close to player
        enemyRef.current.setLinvel({
          x: 0,
          y: 0, // Keep vertical velocity at 0
          z: 0,
        });
        
        // Attack player if close enough
        const now = Date.now();
        if (now - lastAttackTime > 1000) { // Attack once per second
          takeDamage(ENEMY_TYPES[type].damage);
          setLastAttackTime(now);
        }
      }
    }
  });
  
  // Calculate health percentage for display
  const healthPercent = (health / ENEMY_TYPES[type].health) * 100;
  
  return (
    <RigidBody
      ref={enemyRef}
      position={[position[0], Math.max(1.5, position[1]), position[2]]} // Ensure starting above ground
      enabledRotations={[false, true, false]}
      colliders={false}
      type="dynamic"
      mass={1}
      lockAxes={['y']} // Lock Y-axis to prevent sinking
    >
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
      
      {/* Float component for hovering effect */}
      <Float 
        speed={2} 
        rotationIntensity={0.2} 
        floatIntensity={isDying ? 0 : ENEMY_TYPES[type].floatIntensity}
        enabled={!isDying}
      >
        <group scale={isDying ? deathScale * ENEMY_TYPES[type].scale : ENEMY_TYPES[type].scale}>
          {/* Enemy body with distortion material */}
          <mesh castShadow>
            <capsuleGeometry args={[0.5, 1, 8, 16]} />
            <MeshDistortMaterial
              color={isHit ? 'white' : isDying ? '#880000' : ENEMY_TYPES[type].color}
              emissive={isHit ? 'white' : isDying ? '#ff0000' : 'black'}
              emissiveIntensity={isHit ? 0.5 : isDying ? 0.8 : 0}
              transparent={isDying}
              opacity={isDying ? Math.max(0, deathScale) : 1}
              distort={isDying ? 1.0 : ENEMY_TYPES[type].distort}
              speed={isDying ? 5 : 2}
              roughness={0.3}
              metalness={0.8}
            />
          </mesh>
          
          {/* Eyes with glow effect */}
          <mesh position={[0.2, 1.4, 0.4]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial 
              color={isDying ? 'red' : 'white'} 
              emissive={isDying ? 'red' : 'white'}
              emissiveIntensity={isDying ? 0.8 : 0.5}
              transparent={isDying}
              opacity={isDying ? Math.max(0, deathScale) : 1}
            />
          </mesh>
          <mesh position={[-0.2, 1.4, 0.4]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial 
              color={isDying ? 'red' : 'white'} 
              emissive={isDying ? 'red' : 'white'}
              emissiveIntensity={isDying ? 0.8 : 0.5}
              transparent={isDying}
              opacity={isDying ? Math.max(0, deathScale) : 1}
            />
          </mesh>
          
          {/* Sparkles for visual effect */}
          <Sparkles 
            count={20} 
            scale={3} 
            size={0.4} 
            speed={0.3} 
            color={ENEMY_TYPES[type].color}
            opacity={isDying ? deathScale * 0.5 : 0.5}
          />
          
          {/* Trail effect for movement */}
          {!isDying && type === 'fast' && (
            <Trail
              ref={trailRef}
              width={1}
              length={5}
              color={ENEMY_TYPES[type].color}
              attenuation={(width) => width}
              opacity={0.5}
            >
              <mesh position={[0, 0.5, -0.5]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color={ENEMY_TYPES[type].color} transparent opacity={0.5} />
              </mesh>
            </Trail>
          )}
          
          {/* Health bar - only show if not dying */}
          {!isDying && (
            <Billboard position={[0, 2.2, 0]} follow={true}>
              <group>
                <mesh position={[0, 0, 0]} scale={[1, 0.1, 0.1]}>
                  <boxGeometry />
                  <meshBasicMaterial color="black" />
                </mesh>
                <mesh 
                  position={[(healthPercent - 100) / 200, 0, 0.06]} 
                  scale={[healthPercent / 100, 0.08, 0.08]}
                >
                  <boxGeometry />
                  <meshBasicMaterial color={
                    healthPercent > 60 ? 'green' : 
                    healthPercent > 30 ? 'yellow' : 
                    'red'
                  } />
                </mesh>
              </group>
            </Billboard>
          )}
          
          {/* Enemy type label */}
          {!isDying && (
            <Billboard position={[0, 2.5, 0]} follow={true}>
              <Text
                fontSize={0.2}
                color={ENEMY_TYPES[type].color}
                anchorX="center"
                anchorY="middle"
              >
                {type.toUpperCase()}
              </Text>
            </Billboard>
          )}
          
          {/* Death effect particles - only render when dying */}
          {isDying && Array.from({ length: 15 }).map((_, i) => (
            <mesh 
              key={i} 
              position={[
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
              ]}
              scale={[0.1, 0.1, 0.1]}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial 
                color={ENEMY_TYPES[type].color} 
                transparent 
                opacity={Math.max(0, deathScale - 0.2)}
              />
            </mesh>
          ))}
        </group>
      </Float>
    </RigidBody>
  );
}

// Main Enemies component that manages all enemies
export default function Enemies() {
  const [enemies, setEnemies] = useState([]);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const playerPosition = useGameStore((state) => state.playerPosition);
  
  // Maximum number of enemies - moved to a constant
  const MAX_ENEMIES = 20;
  
  // Spawn enemies at random positions - memoized with useCallback
  const spawnEnemy = useCallback(() => {
    if (!playerPosition || enemies.length >= MAX_ENEMIES || isPaused || isGameOver) return;
    
    // Random position around the player, but not too close
    const angle = Math.random() * Math.PI * 2;
    const minDistance = 15; // Minimum spawn distance from player
    const maxDistance = 30; // Maximum spawn distance from player
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    
    const x = playerPosition.x + Math.sin(angle) * distance;
    const z = playerPosition.z + Math.cos(angle) * distance;
    
    // Random enemy type with weighted probability
    const rand = Math.random();
    let type;
    if (rand < 0.6) {
      type = 'basic'; // 60% chance
    } else if (rand < 0.9) {
      type = 'fast';  // 30% chance
    } else {
      type = 'heavy'; // 10% chance
    }
    
    const newEnemy = {
      id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      position: [x, 1.5, z], // Ensure y position is above ground
      type,
      health: ENEMY_TYPES[type].health, // Explicitly set initial health
    };
    
    setEnemies((prev) => [...prev, newEnemy]);
  }, [playerPosition, enemies.length, isPaused, isGameOver]);
  
  // Remove enemy when killed - memoized with useCallback
  const removeEnemy = useCallback((id) => {
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== id));
  }, []);
  
  // Force spawn an enemy for testing - only when no enemies and player exists
  useEffect(() => {
    if (playerPosition && enemies.length === 0 && !isPaused && !isGameOver) {
      // Spawn an enemy right in front of the player for testing
      const direction = new Vector3(0, 0, 1); // Forward direction
      
      const spawnPosition = new Vector3(
        playerPosition.x + direction.x * 10,
        1.5, // Ensure y position is above ground
        playerPosition.z + direction.z * 10
      );
      
      const testEnemy = {
        id: `test-enemy-${Date.now()}`,
        position: [spawnPosition.x, 1.5, spawnPosition.z],
        type: 'basic',
        health: ENEMY_TYPES['basic'].health,
      };
      
      setEnemies([testEnemy]);
    }
  }, [playerPosition, enemies.length, isPaused, isGameOver]);
  
  // Spawn enemies periodically
  useEffect(() => {
    if (isPaused || isGameOver || !playerPosition) return;
    
    const interval = setInterval(() => {
      // Spawn multiple enemies at once with a chance
      const spawnCount = Math.random() < 0.3 ? 2 : 1; // 30% chance to spawn 2 enemies at once
      
      for (let i = 0; i < spawnCount; i++) {
        if (enemies.length < MAX_ENEMIES) { // Check again to prevent exceeding the limit
          spawnEnemy();
        }
      }
    }, 2000); // Spawn frequency
    
    return () => clearInterval(interval);
  }, [isPaused, isGameOver, enemies.length, playerPosition, spawnEnemy]);
  
  // Memoize the enemies array to prevent unnecessary re-renders
  const memoizedEnemies = useMemo(() => enemies, [enemies]);
  
  return (
    <>
      {memoizedEnemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          position={enemy.position}
          type={enemy.type}
          initialHealth={enemy.health}
          onDeath={() => removeEnemy(enemy.id)}
        />
      ))}
    </>
  );
} 