import { TextureLoader, AudioLoader } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Asset lists - add your assets here
const TEXTURES = [
  '/textures/floor.jpg',
  '/textures/wall.jpg',
  '/textures/weapon_pistol.png',
  '/textures/weapon_shotgun.png',
  '/textures/weapon_rifle.png',
];

const MODELS = [
  // Add model paths here when you have them
  // '/models/weapon_pistol.glb',
  // '/models/weapon_shotgun.glb',
  // '/models/weapon_rifle.glb',
];

const SOUNDS = [
  // Add sound paths here when you have them
  // '/sounds/gunshot.mp3',
  // '/sounds/reload.mp3',
  // '/sounds/footstep.mp3',
  '/sounds/jump.m4a',
];

// Create loaders
const textureLoader = new TextureLoader();
const gltfLoader = new GLTFLoader();
const audioLoader = new AudioLoader();

// Cache for loaded assets
const assetCache = {
  textures: {},
  models: {},
  sounds: {},
};

// Load a single texture
const loadTexture = (url) => {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        assetCache.textures[url] = texture;
        resolve(texture);
      },
      undefined,
      (error) => reject(error)
    );
  });
};

// Load a single model
const loadModel = (url) => {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        assetCache.models[url] = gltf;
        resolve(gltf);
      },
      undefined,
      (error) => reject(error)
    );
  });
};

// Load a single sound
const loadSound = (url) => {
  return new Promise((resolve, reject) => {
    audioLoader.load(
      url,
      (buffer) => {
        assetCache.sounds[url] = buffer;
        resolve(buffer);
      },
      undefined,
      (error) => reject(error)
    );
  });
};

// Preload all assets
export const preloadAssets = (onProgress) => {
  const totalAssets = TEXTURES.length + MODELS.length + SOUNDS.length;
  let loadedAssets = 0;
  
  // Update progress function
  const updateProgress = () => {
    loadedAssets++;
    const progress = (loadedAssets / totalAssets) * 100;
    if (onProgress) onProgress(progress);
  };
  
  // Create promises for all assets
  const texturePromises = TEXTURES.map((url) => 
    loadTexture(url).then(updateProgress).catch((error) => {
      console.error(`Failed to load texture: ${url}`, error);
      updateProgress(); // Still update progress even if loading fails
    })
  );
  
  const modelPromises = MODELS.map((url) => 
    loadModel(url).then(updateProgress).catch((error) => {
      console.error(`Failed to load model: ${url}`, error);
      updateProgress();
    })
  );
  
  const soundPromises = SOUNDS.map((url) => 
    loadSound(url).then(updateProgress).catch((error) => {
      console.error(`Failed to load sound: ${url}`, error);
      updateProgress();
    })
  );
  
  // Combine all promises
  return Promise.all([
    ...texturePromises,
    ...modelPromises,
    ...soundPromises,
  ]);
};

// Get a loaded asset from cache
export const getTexture = (url) => assetCache.textures[url];
export const getModel = (url) => assetCache.models[url];
export const getSound = (url) => assetCache.sounds[url];

// Check if all assets are loaded
export const areAllAssetsLoaded = () => {
  const texturesLoaded = TEXTURES.every((url) => assetCache.textures[url]);
  const modelsLoaded = MODELS.every((url) => assetCache.models[url]);
  const soundsLoaded = SOUNDS.every((url) => assetCache.sounds[url]);
  
  return texturesLoaded && modelsLoaded && soundsLoaded;
};

export default {
  preloadAssets,
  getTexture,
  getModel,
  getSound,
  areAllAssetsLoaded,
}; 