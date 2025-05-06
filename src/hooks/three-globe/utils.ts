
import * as THREE from 'three';

/**
 * Check if WebGL is available in the browser
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Dispose Three.js material and its textures
 */
export function disposeMaterial(material: THREE.Material): void {
  if (!material) return;
  
  // Dispose textures
  Object.keys(material).forEach(prop => {
    if (!material[prop]) return;
    if (material[prop] instanceof THREE.Texture) {
      material[prop].dispose();
    }
  });
  
  material.dispose();
}

/**
 * Dispose Three.js objects
 */
export function disposeObject(obj: THREE.Object3D): void {
  if (!obj) return;
  
  // Handle children first
  while (obj.children.length > 0) {
    disposeObject(obj.children[0]);
    obj.remove(obj.children[0]);
  }
  
  // Then handle the object itself
  if (obj instanceof THREE.Mesh) {
    if (obj.geometry) obj.geometry.dispose();
    
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(material => {
          disposeMaterial(material);
        });
      } else {
        disposeMaterial(obj.material);
      }
    }
  }
}

/**
 * Dispose an entire scene
 */
export function disposeScene(scene: THREE.Scene): void {
  while (scene.children.length > 0) {
    disposeObject(scene.children[0]);
    scene.remove(scene.children[0]);
  }
}

/**
 * Easing function for smoother animations
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
