import { create } from 'zustand';
import { Vector3 } from 'three';

const useGameStore = create((set, get) => ({
  // Player state
  health: 100,
  score: 0,
  currentWeapon: 'pistol',
  weapons: ['pistol'],
  ammo: {
    pistol: 30,
    shotgun: 0,
    rifle: 0,
  },
  playerPosition: new Vector3(0, 1, 0),
  mouseSensitivity: 0.6, // Default sensitivity
  
  // Game state
  isPaused: true, // Start paused by default
  isGameOver: false,
  
  // Enemies state
  enemies: [],
  
  // Actions
  takeDamage: (amount) => set((state) => {
    console.log(`Player took ${amount} damage!`);
    const newHealth = Math.max(0, state.health - amount);
    return {
      health: newHealth,
      isGameOver: newHealth <= 0,
    };
  }),
  
  addScore: (points) => set((state) => {
    console.log(`Added ${points} points to score!`);
    return {
      score: state.score + points,
    };
  }),
  
  pickupWeapon: (weapon) => set((state) => {
    console.log(`Picked up ${weapon}!`);
    if (state.weapons.includes(weapon)) {
      // If already have the weapon, just add ammo
      const ammoToAdd = weapon === 'pistol' ? 15 : weapon === 'shotgun' ? 8 : 30;
      console.log(`Added ${ammoToAdd} ammo to ${weapon}`);
      
      return {
        ammo: {
          ...state.ammo,
          [weapon]: state.ammo[weapon] + ammoToAdd,
        },
      };
    }
    
    // Otherwise add the weapon and ammo
    const ammoToAdd = weapon === 'pistol' ? 15 : weapon === 'shotgun' ? 8 : 30;
    console.log(`Added ${weapon} to inventory with ${ammoToAdd} ammo`);
    
    return {
      weapons: [...state.weapons, weapon],
      currentWeapon: weapon,
      ammo: {
        ...state.ammo,
        [weapon]: state.ammo[weapon] + ammoToAdd,
      },
    };
  }),
  
  switchWeapon: (weapon) => set((state) => {
    if (!state.weapons.includes(weapon)) return state;
    
    console.log(`Switched to ${weapon}`);
    return {
      currentWeapon: weapon,
    };
  }),
  
  useAmmo: (amount = 1) => set((state) => {
    const newAmmo = Math.max(0, state.ammo[state.currentWeapon] - amount);
    console.log(`Used ${amount} ammo for ${state.currentWeapon}, ${newAmmo} remaining`);
    
    return {
      ammo: {
        ...state.ammo,
        [state.currentWeapon]: newAmmo,
      },
    };
  }),
  
  togglePause: () => set((state) => {
    const newPausedState = !state.isPaused;
    console.log(`Game ${newPausedState ? 'paused' : 'resumed'}`);
    
    // When pausing, make sure to update the state immediately
    if (newPausedState) {
      // Force immediate state update for pause
      return {
        isPaused: true
      };
    }
    
    // When resuming, add a small delay to ensure all systems are ready
    setTimeout(() => {
      console.log("Pause state fully updated");
    }, 100);
    
    return {
      isPaused: false
    };
  }),
  
  updatePlayerPosition: (position) => set({
    playerPosition: position,
  }),
  
  updateMouseSensitivity: (sensitivity) => set({
    mouseSensitivity: sensitivity,
  }),
  
  resetGame: () => {
    console.log("Game reset");
    set({
      health: 100,
      score: 0,
      currentWeapon: 'pistol',
      weapons: ['pistol'],
      ammo: {
        pistol: 30,
        shotgun: 0,
        rifle: 0,
      },
      playerPosition: new Vector3(0, 1, 0),
      mouseSensitivity: 0.6, // Reset to default
      isPaused: true,
      isGameOver: false,
      enemies: [],
    });
  },
  
  // Debug function to add test weapons
  addTestWeapons: () => set((state) => {
    console.log("Adding test weapons");
    return {
      weapons: ['pistol', 'shotgun', 'rifle'],
      ammo: {
        pistol: 30,
        shotgun: 20,
        rifle: 60,
      },
    };
  }),
}));

// Add test weapons immediately for development
setTimeout(() => {
  useGameStore.getState().addTestWeapons();
}, 1000);

export default useGameStore; 