'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import { Vector3, Raycaster, Quaternion, Euler } from 'three';
import { useKeyboardControls } from '@react-three/drei';
import useGameStore from '@/utils/gameStore';

// Weapon properties
const WEAPON_PROPERTIES = {
  pistol: {
    damage: 25,
    recoil: 0.015,
    cooldown: 300, // ms
    bulletSpeed: 50,
    bulletSize: 0.05,
    bulletColor: '#ffff00',
  },
  shotgun: {
    damage: 80,
    recoil: 0.04,
    cooldown: 800, // ms
    bulletSpeed: 40,
    bulletSize: 0.08,
    bulletColor: '#ff6600',
    pellets: 5,
    spread: 0.2,
  },
  rifle: {
    damage: 40,
    recoil: 0.02,
    cooldown: 150, // ms
    bulletSpeed: 70,
    bulletSize: 0.03,
    bulletColor: '#00ffff',
  },
};

export default function Player({ cameraRef, gameStarted }) {
  const playerRef = useRef();
  const { scene } = useThree();
  const { rapier, world } = useRapier();
  
  // Get game state from store
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const currentWeapon = useGameStore((state) => state.currentWeapon);
  const weapons = useGameStore((state) => state.weapons);
  const ammo = useGameStore((state) => state.ammo);
  const useAmmo = useGameStore((state) => state.useAmmo);
  const switchWeapon = useGameStore((state) => state.switchWeapon);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const addScore = useGameStore((state) => state.addScore);
  
  // Player state
  const [playerPosition, setPlayerPosition] = useState(new Vector3(0, 1, 0));
  const [playerVelocity, setPlayerVelocity] = useState(new Vector3());
  const [onGround, setOnGround] = useState(true);
  const [isShooting, setIsShooting] = useState(false);
  const [lastShootTime, setLastShootTime] = useState(0);
  const [bullets, setBullets] = useState([]);
  const [cameraRotation, setCameraRotation] = useState(new Euler());
  
  // Recoil state
  const [recoilAmount, setRecoilAmount] = useState(0);
  const [recoilRecoverySpeed, setRecoilRecoverySpeed] = useState(0.1);
  const [baseRotationX, setBaseRotationX] = useState(0);
  
  // Movement state - support both WASD and arrow keys
  const [keys, setKeys] = useState({
    forward: false, // W or ArrowUp
    backward: false, // S or ArrowDown
    left: false, // A or ArrowLeft
    right: false, // D or ArrowRight
    jump: false, // Space
    shift: false // Shift
  });
  
  // Movement parameters
  const SPEED = 8; // Increased speed for better responsiveness
  const JUMP_FORCE = 8;
  const RUN_MULTIPLIER = 1.5;
  
  // Handle keyboard input directly
  useEffect(() => {
    console.log("Setting up keyboard controls");
    
    const handleKeyDown = (e) => {
      // Only process movement keys if the game is active
      if (!gameStarted || isPaused || isGameOver) {
        return;
      }
      
      // Update key state - support both WASD and arrow keys
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(prev => ({ ...prev, forward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, left: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(prev => ({ ...prev, backward: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, right: true }));
          break;
        case 'Space':
          setKeys(prev => ({ ...prev, jump: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys(prev => ({ ...prev, shift: true }));
          break;
        case 'Digit1':
          if (weapons.includes('pistol')) switchWeapon('pistol');
          break;
        case 'Digit2':
          if (weapons.includes('shotgun')) switchWeapon('shotgun');
          break;
        case 'Digit3':
          if (weapons.includes('rifle')) switchWeapon('rifle');
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      // Always process key up events to prevent keys getting "stuck"
      // when the game is paused/unpaused
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(prev => ({ ...prev, forward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, left: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(prev => ({ ...prev, backward: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, right: false }));
          break;
        case 'Space':
          setKeys(prev => ({ ...prev, jump: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys(prev => ({ ...prev, shift: false }));
          break;
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Log initial setup
    console.log("Keyboard controls initialized");
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, isPaused, isGameOver, weapons, switchWeapon]);
  
  // Reset all movement keys when game is paused or over
  useEffect(() => {
    if (isPaused || isGameOver) {
      // Reset all movement keys to prevent "stuck" keys
      setKeys({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        shift: false
      });
    }
  }, [isPaused, isGameOver]);
  
  // Find enemies in the scene
  const findEnemies = () => {
    const enemies = [];
    scene.traverse((object) => {
      if (object.userData && object.userData.type === 'enemy' && object.userData.hit) {
        enemies.push(object);
      }
    });
    return enemies;
  };
  
  // Handle shooting
  const shoot = () => {
    if (isPaused || isGameOver || ammo[currentWeapon] <= 0 || !cameraRef.current) return;
    
    const now = Date.now();
    const cooldown = WEAPON_PROPERTIES[currentWeapon].cooldown;
    
    if (now - lastShootTime < cooldown) return;
    
    setIsShooting(true);
    setLastShootTime(now);
    useAmmo();
    
    // Reset shooting state after animation
    setTimeout(() => setIsShooting(false), 200);
    
    // Get camera direction for bullet trajectory
    const direction = new Vector3();
    cameraRef.current.getWorldDirection(direction);
    
    // Apply weapon properties
    const weaponProps = WEAPON_PROPERTIES[currentWeapon];
    
    // Create bullets
    if (currentWeapon === 'shotgun') {
      // Shotgun creates multiple pellets with spread
      for (let i = 0; i < weaponProps.pellets; i++) {
        const spreadDirection = direction.clone();
        
        // Add random spread
        spreadDirection.x += (Math.random() - 0.5) * weaponProps.spread;
        spreadDirection.y += (Math.random() - 0.5) * weaponProps.spread;
        spreadDirection.z += (Math.random() - 0.5) * weaponProps.spread;
        spreadDirection.normalize();
        
        createBullet(spreadDirection, weaponProps);
      }
    } else {
      // Single bullet for pistol and rifle
      createBullet(direction, weaponProps);
    }
    
    // Store current base rotation before applying recoil
    setBaseRotationX(cameraRef.current.rotation.x);
    
    // Apply recoil to camera with safety limits
    const recoil = WEAPON_PROPERTIES[currentWeapon].recoil;
    
    // Apply recoil to camera rotation
    const newRotationX = cameraRef.current.rotation.x - recoil;
    
    // Apply rotation with limits to prevent flipping
    cameraRef.current.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newRotationX));
    
    // Set recoil amount for recovery
    setRecoilAmount(recoil);
    
    // Direct hit check with raycaster
    const raycaster = new Raycaster();
    raycaster.set(cameraRef.current.position, direction);
    
    // Find all enemies in the scene
    const enemies = findEnemies();
    
    // Check for direct hits with enemies
    if (enemies.length > 0) {
      // Get all objects that can be hit
      const hitObjects = enemies.map(enemy => {
        // Get the mesh from the enemy
        let mesh = null;
        enemy.traverse((child) => {
          if (child.isMesh && !mesh) {
            mesh = child;
          }
        });
        return mesh;
      }).filter(Boolean);
      
      // Check for intersections
      const intersects = raycaster.intersectObjects(hitObjects);
      
      if (intersects.length > 0) {
        // Get the first hit
        const hit = intersects[0];
        
        // Find the parent enemy
        let enemyObject = hit.object;
        while (enemyObject && (!enemyObject.userData || !enemyObject.userData.hit)) {
          enemyObject = enemyObject.parent;
        }
        
        // If we found an enemy, hit it
        if (enemyObject && enemyObject.userData && enemyObject.userData.hit) {
          enemyObject.userData.hit(weaponProps.damage);
          console.log("Direct hit on enemy!");
        }
      }
    }
  };
  
  // Create a bullet
  const createBullet = (direction, weaponProps) => {
    const bulletPosition = cameraRef.current.position.clone();
    // Move bullet forward a bit to avoid collision with player
    bulletPosition.add(direction.clone().multiplyScalar(1));
    
    const bullet = {
      id: Date.now() + Math.random(),
      position: bulletPosition,
      direction: direction,
      speed: weaponProps.bulletSpeed,
      size: weaponProps.bulletSize,
      color: weaponProps.bulletColor,
      damage: weaponProps.damage,
      timeCreated: Date.now(),
      lifetime: 3000, // 3 seconds max lifetime
    };
    
    setBullets(prev => [...prev, bullet]);
  };
  
  // Update bullets and handle recoil recovery
  useFrame((state, delta) => {
    if (isPaused || isGameOver || !cameraRef.current) return;
    
    // Handle recoil recovery
    if (recoilAmount > 0) {
      // Gradually recover from recoil with smoother motion
      const recovery = Math.min(recoilAmount, recoilRecoverySpeed * delta * 60);
      
      // Calculate new rotation with recovery
      const newRotationX = cameraRef.current.rotation.x + recovery;
      
      // Apply rotation with limits to prevent flipping
      cameraRef.current.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newRotationX));
      
      setRecoilAmount(prev => Math.max(0, prev - recovery));
      
      // Ensure we don't overshoot the original rotation
      if (cameraRef.current.rotation.x > baseRotationX) {
        cameraRef.current.rotation.x = baseRotationX;
        setRecoilAmount(0);
      }
    }
    
    // Update bullet positions and check for collisions
    setBullets(prev => {
      const now = Date.now();
      return prev
        .filter(bullet => {
          // Remove bullets that have exceeded their lifetime
          if (now - bullet.timeCreated > bullet.lifetime) {
            return false;
          }
          
          // Move bullet forward
          bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * delta));
          
          // Check for collisions with world
          const bulletRay = new rapier.Ray(
            bullet.position,
            bullet.direction
          );
          const hit = world.castRay(bulletRay, 0.5, true);
          
          if (hit) {
            // Hit something, check what it is
            const hitObject = hit.collider.parent();
            if (hitObject && hitObject.userData) {
              // Check if it's an enemy
              if (hitObject.userData.type === 'enemy' && hitObject.userData.hit) {
                hitObject.userData.hit(bullet.damage);
                console.log("Bullet hit enemy!");
                addScore(5); // Add score for hitting enemy
              }
            }
            return false; // Remove bullet after hit
          }
          
          // Check for collisions with enemies using distance
          const enemies = findEnemies();
          for (const enemy of enemies) {
            if (enemy.position) {
              const distance = bullet.position.distanceTo(new Vector3(
                enemy.position.x,
                enemy.position.y,
                enemy.position.z
              ));
              
              // If bullet is close to enemy, count as hit
              if (distance < 1.5) {
                if (enemy.userData && enemy.userData.hit) {
                  enemy.userData.hit(bullet.damage);
                  console.log("Bullet proximity hit on enemy!");
                  addScore(5); // Add score for hitting enemy
                }
                return false; // Remove bullet after hit
              }
            }
          }
          
          return true; // Keep bullet
        });
    });
  });
  
  // Handle mouse click for shooting
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (gameStarted && !isPaused && !isGameOver && e.button === 0) {
        shoot();
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [gameStarted, isPaused, isGameOver, currentWeapon, ammo, cameraRef]);
  
  // Player movement and physics
  useFrame((state, delta) => {
    if (!playerRef.current || !gameStarted || isPaused || isGameOver || !cameraRef.current) return;
    
    // Get player position and update camera
    const position = playerRef.current.translation();
    
    // Update camera position to follow player
    cameraRef.current.position.set(position.x, position.y + 1.5, position.z);
    
    // Store current rotation for recoil recovery
    setBaseRotationX(cameraRef.current.rotation.x);
    
    // Calculate movement direction based on camera direction
    const moveDirection = new Vector3();
    
    // Get forward and right vectors from camera
    const cameraDirection = new Vector3();
    const cameraRight = new Vector3();
    
    cameraRef.current.getWorldDirection(cameraDirection);
    cameraRight.crossVectors(cameraRef.current.up, cameraDirection).normalize();
    
    // Zero out the y component to keep movement horizontal
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Calculate movement vector based on keys
    if (keys.forward) moveDirection.add(cameraDirection);
    if (keys.backward) moveDirection.sub(cameraDirection);
    if (keys.left) moveDirection.add(cameraRight);
    if (keys.right) moveDirection.sub(cameraRight);
    
    // Normalize and apply speed
    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      const speedMultiplier = keys.shift ? SPEED * RUN_MULTIPLIER : SPEED;
      moveDirection.multiplyScalar(speedMultiplier * delta);
    }
    
    // Apply movement to player
    playerRef.current.setLinvel({ 
      x: moveDirection.x * 60, 
      y: playerRef.current.linvel().y, 
      z: moveDirection.z * 60 
    });
    
    // Handle jumping
    if (keys.jump && onGround) {
      playerRef.current.setLinvel({ 
        x: playerRef.current.linvel().x, 
        y: JUMP_FORCE, 
        z: playerRef.current.linvel().z 
      });
      setOnGround(false);
    }
    
    // Check if player is on ground
    const rayOrigin = new Vector3(position.x, position.y - 0.5, position.z);
    const rayDirection = new Vector3(0, -1, 0);
    const ray = new rapier.Ray(rayOrigin, rayDirection);
    const hit = world.castRay(ray, 0.75, true);
    
    if (hit && hit.toi < 0.2) {
      setOnGround(true);
    }
    
    // Update player position state
    const newPosition = new Vector3(position.x, position.y, position.z);
    setPlayerPosition(newPosition);
    updatePlayerPosition(newPosition);
  });
  
  // Render bullets
  const renderBullets = () => {
    return bullets.map(bullet => (
      <mesh key={bullet.id} position={bullet.position.toArray()}>
        <sphereGeometry args={[bullet.size, 8, 8]} />
        <meshStandardMaterial color={bullet.color} emissive={bullet.color} emissiveIntensity={2} />
        <pointLight color={bullet.color} intensity={1} distance={2} />
      </mesh>
    ));
  };
  
  return (
    <>
      <RigidBody
        ref={playerRef}
        position={[0, 3, 0]}
        enabledRotations={[false, false, false]}
        colliders={false}
        mass={1}
        type="dynamic"
        lockRotations
      >
        <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
      </RigidBody>
      
      {/* Render bullets */}
      {renderBullets()}
    </>
  );
} 