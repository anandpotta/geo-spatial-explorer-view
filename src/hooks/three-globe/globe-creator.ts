
import * as THREE from 'three';
import { EARTH_RADIUS } from './types';

/**
 * Create the Earth globe with textures and visual enhancements
 */
export function createGlobe(): THREE.Mesh {
  // Create a sphere geometry for the globe with higher detail
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  
  // Create a texture loader
  const textureLoader = new THREE.TextureLoader();
  
  // Load earth textures (high-resolution)
  const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_4k.jpg');
  const bumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_4k.jpg');
  const specularMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_4k.jpg');
  const cloudsTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_2048.jpg');
  const nightTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.jpg');
  
  // Create enhanced material with textures
  const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpMap,
    bumpScale: 0.05,
    specularMap: specularMap,
    specular: new THREE.Color(0x333333),
    shininess: 25
  });
  
  // Create the mesh using the geometry and material
  const globe = new THREE.Mesh(geometry, material);
  
  // Add cloud layer
  addCloudsLayer(globe);
  
  // Add grid lines and atmosphere
  addLatLongGrid(globe);
  addAtmosphereGlow(globe);
  
  // Add night lights
  addNightLights(globe, nightTexture);
  
  return globe;
}

/**
 * Add a cloud layer to the globe
 */
function addCloudsLayer(globe: THREE.Mesh): void {
  const cloudsGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.01, 64, 64);
  const cloudsTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_2048.jpg');
  
  const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsTexture,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide
  });
  
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  globe.add(clouds);
  
  // Make clouds rotate slightly differently from the Earth
  const autoRotateClouds = () => {
    clouds.rotation.y += 0.0002;
    requestAnimationFrame(autoRotateClouds);
  };
  autoRotateClouds();
}

/**
 * Add a night lights layer to the globe
 */
function addNightLights(globe: THREE.Mesh, nightTexture: THREE.Texture): void {
  const nightSideGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.001, 64, 64);
  const nightSideMaterial = new THREE.MeshBasicMaterial({
    map: nightTexture,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  
  const nightSide = new THREE.Mesh(nightSideGeometry, nightSideMaterial);
  globe.add(nightSide);
}

/**
 * Add atmosphere glow effect to the globe
 */
export function addAtmosphereGlow(globe: THREE.Mesh): void {
  // Add inner atmosphere (blue glow)
  const innerAtmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64);
  const innerAtmosphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.4,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  
  const innerAtmosphere = new THREE.Mesh(innerAtmosphereGeometry, innerAtmosphereMaterial);
  globe.add(innerAtmosphere);
  
  // Add outer atmosphere (subtle glow)
  const outerAtmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.05, 64, 64);
  const outerAtmosphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x4ca5ff,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  
  const outerAtmosphere = new THREE.Mesh(outerAtmosphereGeometry, outerAtmosphereMaterial);
  globe.add(outerAtmosphere);
}

/**
 * Add a simple latitude/longitude grid to the globe
 */
export function addLatLongGrid(globe: THREE.Mesh): void {
  const lineColor = 0x66AAFF;
  const material = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.2 });
  
  // Add longitude lines
  for (let i = 0; i < 24; i++) {
    const phi = (i / 24) * Math.PI * 2;
    const points = [];
    for (let j = 0; j <= 180; j++) {
      const theta = (j / 180) * Math.PI;
      const x = EARTH_RADIUS * Math.sin(theta) * Math.cos(phi);
      const y = EARTH_RADIUS * Math.cos(theta);
      const z = EARTH_RADIUS * Math.sin(theta) * Math.sin(phi);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    globe.add(line);
  }
  
  // Add latitude lines
  for (let i = 0; i < 12; i++) {
    const theta = (i / 12) * Math.PI;
    const points = [];
    for (let j = 0; j <= 360; j++) {
      const phi = (j / 360) * Math.PI * 2;
      const x = EARTH_RADIUS * Math.sin(theta) * Math.cos(phi);
      const y = EARTH_RADIUS * Math.cos(theta);
      const z = EARTH_RADIUS * Math.sin(theta) * Math.sin(phi);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    globe.add(line);
  }
}

/**
 * Add stars to the background with improved visuals
 */
export function addStars(scene: THREE.Scene): void {
  // Create multiple star layers for parallax effect
  addStarLayer(scene, 20000, 0.8, EARTH_RADIUS * 20);
  addStarLayer(scene, 10000, 1.2, EARTH_RADIUS * 15);
  addStarLayer(scene, 5000, 1.5, EARTH_RADIUS * 12);
  
  // Add a few bright stars
  addBrightStars(scene, 100);
}

/**
 * Add a layer of stars with specific parameters
 */
function addStarLayer(scene: THREE.Scene, count: number, size: number, radius: number): void {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: size,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  const starsVertices = [];
  for (let i = 0; i < count; i++) {
    // Create a sphere of stars around the scene
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    starsVertices.push(x, y, z);
  }
  
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

/**
 * Add a few bright stars
 */
function addBrightStars(scene: THREE.Scene, count: number): void {
  const brightStarsGeometry = new THREE.BufferGeometry();
  const brightStarsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2.5,
    transparent: true,
    opacity: 1,
    sizeAttenuation: true
  });
  
  const brightStarsVertices = [];
  for (let i = 0; i < count; i++) {
    const radius = EARTH_RADIUS * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    brightStarsVertices.push(x, y, z);
  }
  
  brightStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(brightStarsVertices, 3));
  const brightStars = new THREE.Points(brightStarsGeometry, brightStarsMaterial);
  scene.add(brightStars);
}
