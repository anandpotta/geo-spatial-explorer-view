
import { useCallback, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hook for managing markers on a Three.js globe
 */
export function useMarkers(scene: THREE.Scene | null) {
  // Store markers
  const markersRef = useRef<Map<string, THREE.Mesh>>(new Map());
  
  // Add marker at specific coordinates
  const addMarker = useCallback((id: string, position: THREE.Vector3, label?: string) => {
    if (!scene) return;
    
    // Remove existing marker with the same ID if it exists
    if (markersRef.current.has(id)) {
      const existingMarker = markersRef.current.get(id);
      if (existingMarker) {
        scene.remove(existingMarker);
      }
      markersRef.current.delete(id);
    }
    
    // Create marker geometry
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Set position
    marker.position.copy(position);
    
    // Add to scene
    scene.add(marker);
    
    // Store in markers map
    markersRef.current.set(id, marker);
    
    // If there's a label, add it
    if (label) {
      console.log(`Added marker for: ${label}`);
    }
    
    return marker;
  }, [scene]);
  
  // Clear all markers
  const clearMarkers = useCallback(() => {
    if (!scene) return;
    
    // Remove all markers from the scene
    markersRef.current.forEach((marker, id) => {
      if (marker) {
        scene.remove(marker);
        // Also dispose of geometries and materials to prevent memory leaks
        if (marker.geometry) marker.geometry.dispose();
        if (marker.material instanceof THREE.Material) {
          marker.material.dispose();
        } else if (Array.isArray(marker.material)) {
          marker.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Clear the markers map
    markersRef.current.clear();
    console.log("Cleared all markers from the globe");
  }, [scene]);
  
  return {
    addMarker,
    clearMarkers,
    markersRef
  };
}
