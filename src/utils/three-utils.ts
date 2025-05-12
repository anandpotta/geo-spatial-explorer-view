
import * as THREE from 'three';

/**
 * Helper function to check if a coordinate is valid (not NaN, Infinity, etc.)
 */
export function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

/**
 * Converts latitude and longitude to 3D position on a sphere
 * @param latitude Latitude in degrees
 * @param longitude Longitude in degrees
 * @param radius Sphere radius
 * @returns Vector3 position
 */
export function latLongToVector3(latitude: number, longitude: number, radius: number): THREE.Vector3 {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Creates a marker at the specified position
 * @param latitude Latitude in degrees
 * @param longitude Longitude in degrees
 * @param radius Globe radius
 * @param color Marker color
 * @returns Mesh object
 */
export function createLocationMarker(
  latitude: number,
  longitude: number,
  radius: number,
  color: number = 0xff0000
): THREE.Mesh {
  // Create marker geometry
  const markerGeometry = new THREE.SphereGeometry(radius * 0.02, 16, 16);
  const markerMaterial = new THREE.MeshPhongMaterial({ color });
  
  // Create marker mesh
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  
  // Position marker on the globe
  const position = latLongToVector3(latitude, longitude, radius * 1.02); // Slightly above surface
  marker.position.copy(position);
  
  return marker;
}

/**
 * Safely disposes of a Three.js object and all its children
 * @param object Object to dispose
 */
export function disposeObject3D(object: THREE.Object3D): void {
  if (!object) return;
  
  // Handle children first
  while (object.children.length > 0) {
    disposeObject3D(object.children[0]);
    object.remove(object.children[0]);
  }
  
  // Dispose of geometries and materials
  if ((object as THREE.Mesh).geometry) {
    (object as THREE.Mesh).geometry.dispose();
  }
  
  if ((object as THREE.Mesh).material) {
    const material = (object as THREE.Mesh).material;
    
    if (Array.isArray(material)) {
      material.forEach(mat => {
        if (mat.map) {
          mat.map.dispose();
        }
        mat.dispose();
      });
    } else {
      if (material.map) {
        material.map.dispose();
      }
      material.dispose();
    }
  }
}
