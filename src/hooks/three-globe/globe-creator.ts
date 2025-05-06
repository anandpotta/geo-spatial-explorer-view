
import * as THREE from 'three';
import { EARTH_RADIUS } from './types';

/**
 * Create the Earth globe with textures and visual enhancements
 */
export function createGlobe(): THREE.Mesh {
  // Create a sphere geometry for the globe
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  
  // Create a texture loader
  const textureLoader = new THREE.TextureLoader();
  
  // Load earth textures
  const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg');
  const bumpMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg');
  const specularMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg');
  
  // Create material with textures
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
  
  // Add grid lines and atmosphere
  addLatLongGrid(globe);
  addAtmosphereGlow(globe);
  
  return globe;
}

/**
 * Add atmosphere glow effect to the globe
 */
export function addAtmosphereGlow(globe: THREE.Mesh): void {
  // Add a slightly larger sphere with a shader material for the glow effect
  const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 64);
  const atmosphereMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide
  });
  
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  globe.add(atmosphere);
}

/**
 * Add a simple latitude/longitude grid to the globe
 */
export function addLatLongGrid(globe: THREE.Mesh): void {
  const lineColor = 0x55AAFF;
  const material = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.4 });
  
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
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    sizeAttenuation: true
  });
  
  const starsVertices = [];
  for (let i = 0; i < 15000; i++) {
    // Create a sphere of stars around the scene
    const radius = EARTH_RADIUS * 15;
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
