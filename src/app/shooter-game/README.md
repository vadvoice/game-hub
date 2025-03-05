# 3D Shooter Game

A basic 3D first-person shooter game built with React Three Fiber, Drei, and Rapier physics.

## Features

- First-person movement and camera controls
- Shooting mechanics with different weapons
- Enemy AI that follows and attacks the player
- Weapon pickups scattered around the map
- Health, ammo, and score tracking
- Pause menu and game over screen

## Controls

- **WASD** - Move around
- **Mouse** - Look around
- **Left Click** - Shoot
- **E** - Pick up weapons when near them
- **1, 2, 3** - Switch between weapons
- **ESC** - Pause/Resume game

## Technical Details

This game uses:

- **React Three Fiber** - React renderer for Three.js
- **Drei** - Useful helpers for React Three Fiber
- **Rapier** - Physics engine for realistic movement and collisions
- **Zustand** - State management
- **Next.js** - React framework

## Development

To run the game locally:

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Run the development server with `pnpm dev`
4. Open [http://localhost:3000/shooter-game](http://localhost:3000/shooter-game) in your browser

## Future Improvements

- Add more detailed 3D models for weapons and enemies
- Implement more advanced enemy AI
- Add sound effects and background music
- Create more levels and environments
- Add a scoring system and leaderboard 