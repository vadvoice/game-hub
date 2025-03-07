'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';
import { Vector3, Raycaster, Quaternion, Euler, Audio, PositionalAudio, AudioListener, MathUtils } from 'three';
import { useKeyboardControls, useTexture, MeshWobbleMaterial, Float, useGLTF, MeshDistortMaterial, Sparkles, Center } from '@react-three/drei';
import useGameStore from '@/utils/gameStore';
import * as assetLoader from '@/utils/assetLoader';

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

// Add weapon models and properties
const WEAPON_MODELS = {
  pistol: {
    position: [0.4, -0.3, -0.5], // Right side, slightly down, forward
    rotation: [0, 0, 0],
    scale: [0.3, 0.3, 0.3],
    wobbleSpeed: 0.5,
    wobbleFactor: 0.1,
    sparkleCount: 5,
    sparkleSize: 0.3,
    sparkleSpeed: 0.3,
    floatIntensity: 0.1
  },
  shotgun: {
    position: [0.4, -0.25, -0.6],
    rotation: [0, 0, 0],
    scale: [0.35, 0.35, 0.35],
    wobbleSpeed: 0.3,
    wobbleFactor: 0.05,
    sparkleCount: 8,
    sparkleSize: 0.4,
    sparkleSpeed: 0.2,
    floatIntensity: 0.05
  },
  rifle: {
    position: [0.4, -0.3, -0.7],
    rotation: [0, 0, 0],
    scale: [0.3, 0.3, 0.3],
    wobbleSpeed: 0.7,
    wobbleFactor: 0.03,
    sparkleCount: 10,
    sparkleSize: 0.2,
    sparkleSpeed: 0.5,
    floatIntensity: 0.08
  }
};

// Enhanced WeaponModel component with Drei features
function WeaponModel({ type, isRecoiling }) {
  const weaponConfig = WEAPON_MODELS[type];
  const groupRef = useRef();
  
  // Load weapon textures
  const texturePath = `/textures/weapon_${type}.png`;
  const texture = useTexture(texturePath);
  
  // Apply recoil animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Return to original position if not recoiling
      if (!isRecoiling) {
        groupRef.current.position.z = MathUtils.lerp(
          groupRef.current.position.z,
          0,
          delta * 5
        );
        groupRef.current.rotation.x = MathUtils.lerp(
          groupRef.current.rotation.x,
          0,
          delta * 5
        );
      } else {
        // Apply recoil effect
        groupRef.current.position.z = 0.2;
        groupRef.current.rotation.x = -0.2;
      }
    }
  });
  
  return (
    <group
      position={weaponConfig.position}
      rotation={weaponConfig.rotation}
      scale={weaponConfig.scale}
    >
      <Float 
        speed={1} 
        rotationIntensity={0} 
        floatIntensity={weaponConfig.floatIntensity}
      >
        <Center>
          <group ref={groupRef}>
            {type === 'pistol' && (
              <>
                {/* Pistol body */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 0.8, 2]} />
                  <MeshWobbleMaterial 
                    map={texture} 
                    factor={weaponConfig.wobbleFactor} 
                    speed={weaponConfig.wobbleSpeed}
                    metalness={0.8}
                    roughness={0.2}
                  />
                </mesh>
                {/* Pistol handle */}
                <mesh position={[0, -0.8, 0.5]}>
                  <boxGeometry args={[0.8, 1.2, 0.8]} />
                  <meshStandardMaterial 
                    map={texture} 
                    metalness={0.5}
                    roughness={0.5}
                  />
                </mesh>
                {/* Pistol barrel */}
                <mesh position={[0, 0.1, -1.2]} rotation={[Math.PI/2, 0, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
                  <MeshDistortMaterial 
                    color="#333333" 
                    metalness={0.9}
                    roughness={0.1}
                    distort={0.2}
                  />
                </mesh>
                <Sparkles 
                  count={weaponConfig.sparkleCount} 
                  scale={weaponConfig.sparkleSize} 
                  size={2} 
                  speed={weaponConfig.sparkleSpeed} 
                  color="#ffff80" 
                />
              </>
            )}
            
            {type === 'shotgun' && (
              <>
                {/* Shotgun body */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 0.8, 3]} />
                  <MeshWobbleMaterial 
                    map={texture} 
                    factor={weaponConfig.wobbleFactor} 
                    speed={weaponConfig.wobbleSpeed}
                    metalness={0.6}
                    roughness={0.3}
                  />
                </mesh>
                {/* Shotgun handle */}
                <mesh position={[0, -0.8, 0.8]}>
                  <boxGeometry args={[0.8, 1.5, 0.8]} />
                  <meshStandardMaterial 
                    map={texture} 
                    metalness={0.3}
                    roughness={0.7}
                  />
                </mesh>
                {/* Shotgun barrel */}
                <mesh position={[0, 0.1, -1.8]} rotation={[Math.PI/2, 0, 0]}>
                  <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
                  <MeshDistortMaterial 
                    color="#222222" 
                    metalness={0.9}
                    roughness={0.1}
                    distort={0.1}
                  />
                </mesh>
                <Sparkles 
                  count={weaponConfig.sparkleCount} 
                  scale={weaponConfig.sparkleSize} 
                  size={2} 
                  speed={weaponConfig.sparkleSpeed} 
                  color="#ff8040" 
                />
              </>
            )}
            
            {type === 'rifle' && (
              <>
                {/* Rifle body */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 0.8, 4]} />
                  <MeshWobbleMaterial 
                    map={texture} 
                    factor={weaponConfig.wobbleFactor} 
                    speed={weaponConfig.wobbleSpeed}
                    metalness={0.7}
                    roughness={0.2}
                  />
                </mesh>
                {/* Rifle handle */}
                <mesh position={[0, -0.8, 1]}>
                  <boxGeometry args={[0.8, 1.3, 0.8]} />
                  <meshStandardMaterial 
                    map={texture} 
                    metalness={0.4}
                    roughness={0.6}
                  />
                </mesh>
                {/* Rifle barrel */}
                <mesh position={[0, 0.1, -2.5]} rotation={[Math.PI/2, 0, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 2, 16]} />
                  <MeshDistortMaterial 
                    color="#444444" 
                    metalness={0.9}
                    roughness={0.1}
                    distort={0.05}
                  />
                </mesh>
                {/* Rifle scope */}
                <mesh position={[0, 0.6, -0.5]}>
                  <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
                  <meshStandardMaterial 
                    color="#111111" 
                    metalness={0.9}
                    roughness={0.1}
                  />
                </mesh>
                <Sparkles 
                  count={weaponConfig.sparkleCount} 
                  scale={weaponConfig.sparkleSize} 
                  size={2} 
                  speed={weaponConfig.sparkleSpeed} 
                  color="#40e0ff" 
                />
              </>
            )}
          </group>
        </Center>
      </Float>
    </group>
  );
}

export default function Player({ cameraRef, gameStarted }) {
  const playerRef = useRef();
  const audioListenerRef = useRef();
  const jumpSoundRef = useRef();
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
  const [lastJumpTime, setLastJumpTime] = useState(0);
  const [jumpCount, setJumpCount] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [lastShootTime, setLastShootTime] = useState(0);
  const [bullets, setBullets] = useState([]);
  const [cameraRotation, setCameraRotation] = useState(new Euler());
  const [jumpEffects, setJumpEffects] = useState([]);
  
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
  const SPEED = 8;
  const JUMP_FORCE = 4; // Reduced from 8 to 4 for lower jumps
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
    if (keys.jump) {
      // Remove onGround check temporarily to debug jumping
      playerRef.current.setLinvel({ 
        x: playerRef.current.linvel().x, 
        y: JUMP_FORCE, 
        z: playerRef.current.linvel().z 
      });
      
      // Play jump sound
      if (jumpSoundRef.current && jumpSoundRef.current.buffer) {
        if (jumpSoundRef.current.isPlaying) {
          jumpSoundRef.current.stop();
        }
        jumpSoundRef.current.play();
      }
      
      // Create jump effect
      createJumpEffect(position);
    }
    
    // Modify ground detection
    const rayOrigin = new Vector3(position.x, position.y, position.z);
    const rayDirection = new Vector3(0, -1, 0);
    const ray = new rapier.Ray(rayOrigin, rayDirection);
    const hit = world.castRay(ray, 0.2, true); // Reduced ray distance for more accurate ground detection
    
    if (hit) {
      setOnGround(true);
    } else {
      setOnGround(false);
    }
    
    // Update player position state
    const newPosition = new Vector3(position.x, position.y, position.z);
    setPlayerPosition(newPosition);
    updatePlayerPosition(newPosition);
  });
  
  // Create a jump effect
  const createJumpEffect = (position) => {
    const effect = {
      id: Date.now() + Math.random(),
      position: new Vector3(position.x, position.y, position.z),
      scale: 1,
      opacity: 1,
      createdAt: Date.now(),
      lifetime: 500, // Effect lasts for 500ms
    };
    
    setJumpEffects(prev => [...prev, effect]);
  };
  
  // Update jump effects
  useFrame((state, delta) => {
    if (isPaused || isGameOver) return;
    
    // Update jump effects
    setJumpEffects(prev => {
      const now = Date.now();
      return prev
        .filter(effect => {
          // Remove effects that have exceeded their lifetime
          if (now - effect.createdAt > effect.lifetime) {
            return false;
          }
          
          // Update effect properties
          const progress = (now - effect.createdAt) / effect.lifetime;
          effect.scale = 1 + progress * 2;
          effect.opacity = 1 - progress;
          
          return true;
        });
    });
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
  
  // Render jump effects
  const renderJumpEffects = () => {
    return jumpEffects.map(effect => (
      <mesh key={effect.id} position={effect.position.toArray()}>
        <ringGeometry args={[0.5, 0.7, 16]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent={true} 
          opacity={effect.opacity}
        />
        <group scale={[effect.scale, effect.scale, effect.scale]} />
      </mesh>
    ));
  };
  
  // Initialize audio listener and jump sound
  useEffect(() => {
    if (!cameraRef.current) return;
    
    // Create audio listener if it doesn't exist
    if (!audioListenerRef.current) {
      audioListenerRef.current = new AudioListener();
      cameraRef.current.add(audioListenerRef.current);
    }
    
    // Create jump sound if it doesn't exist
    if (!jumpSoundRef.current) {
      jumpSoundRef.current = new PositionalAudio(audioListenerRef.current);
      scene.add(jumpSoundRef.current);
      
      // Load jump sound
      const jumpSound = assetLoader.getSound('/sounds/jump.mp3');
      if (jumpSound) {
        jumpSoundRef.current.setBuffer(jumpSound);
        jumpSoundRef.current.setRefDistance(1);
        jumpSoundRef.current.setVolume(0.5);
      }
    }
  }, [cameraRef, scene]);
  
  // Initialize camera position and rotation
  useEffect(() => {
    if (!cameraRef.current) return;
    
    // Set initial camera rotation to look at horizon (0 degrees on X axis)
    cameraRef.current.rotation.x = 0;
    cameraRef.current.rotation.y = 0;
    cameraRef.current.rotation.z = 0;
    
  }, [cameraRef]);
  
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
      
      {/* Add weapon model to camera */}
      {cameraRef.current && (
        <primitive object={cameraRef.current}>
          <WeaponModel 
            type={currentWeapon} 
            isRecoiling={isShooting}
          />
        </primitive>
      )}
      
      {/* Render bullets */}
      {renderBullets()}
      
      {/* Render jump effects */}
      {renderJumpEffects()}
    </>
  );
} 