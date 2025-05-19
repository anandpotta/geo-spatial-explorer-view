
import { useRef, useCallback } from 'react';
import * as THREE from 'three';

export function useMarkers(scene: THREE.Scene | null) {
  const markersRef = useRef<Map<string, THREE.Mesh>>(new Map());
  
  // Add a marker to the scene
  const addMarker = useCallback((id: string, position: THREE.Vector3, label?: string): THREE.Mesh => {
    if (!scene) {
      console.warn("Cannot add marker: Scene not available");
      // Return a dummy mesh that won't be added to scene
      return new THREE.Mesh();
    }
    
    // Remove any existing marker with the same ID
    if (markersRef.current.has(id)) {
      const existingMarker = markersRef.current.get(id);
      if (existingMarker && scene.children.includes(existingMarker)) {
        scene.remove(existingMarker);
        // Dispose geometry and material
        if (existingMarker.geometry) existingMarker.geometry.dispose();
        if (existingMarker.material) {
          if (Array.isArray(existingMarker.material)) {
            existingMarker.material.forEach(m => m.dispose());
          } else {
            existingMarker.material.dispose();
          }
        }
      }
      markersRef.current.delete(id);
    }
    
    // Create marker geometry and material
    const markerGeometry = new THREE.SphereGeometry(0.02, 8, 8); // Reduced segments for better performance
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    
    // Create marker mesh
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    marker.name = `marker-${id}`;
    
    // Add marker to scene
    scene.add(marker);
    
    // Store marker reference
    markersRef.current.set(id, marker);
    
    console.log(`Added marker for: ${label || id}`);
    return marker;
  }, [scene]);
  
  // Cleanup function to remove all markers
  const cleanup = useCallback(() => {
    if (!scene) return;
    
    if (markersRef.current.size > 0) {
      console.log("Cleaning up markers");
      markersRef.current.forEach((marker) => {
        if (scene.children.includes(marker)) {
          scene.remove(marker);
          if (marker.geometry) marker.geometry.dispose();
          if (marker.material) {
            if (Array.isArray(marker.material)) {
              marker.material.forEach(m => m.dispose());
            } else {
              marker.material.dispose();
            }
          }
        }
      });
      markersRef.current.clear();
    }
  }, [scene]);
  
  return {
    addMarker,
    markersRef,
    cleanup
  };
}
