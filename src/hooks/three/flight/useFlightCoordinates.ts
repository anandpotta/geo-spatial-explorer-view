
import { useCallback } from 'react';
import * as THREE from 'three';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook for calculating flight coordinates and positions
 */
export function useFlightCoordinates(globeRadius: number) {
  // Validate coordinates
  const validateCoordinates = useCallback((longitude: number, latitude: number): boolean => {
    if (isNaN(longitude) || isNaN(latitude)) {
      console.error(`Invalid coordinates: longitude=${longitude}, latitude=${latitude}`);
      toast({
        title: "Navigation Error",
        description: "Invalid coordinates provided",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, []);

  // Calculate target position on the globe from lat/long
  const calculateTargetPosition = useCallback((longitude: number, latitude: number): THREE.Vector3 => {
    // Convert lat/long to radians for correct positioning
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = longitude * (Math.PI / 180);
    
    // Calculate the point on the globe's surface
    const targetX = -globeRadius * Math.sin(phi) * Math.cos(theta);
    const targetY = globeRadius * Math.cos(phi);
    const targetZ = globeRadius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(targetX, targetY, targetZ);
  }, [globeRadius]);

  // Calculate camera positions for the flight
  const calculateCameraPositions = useCallback((
    target: THREE.Vector3, 
    startPosition: THREE.Vector3
  ) => {
    // Distance values for dramatic effect
    const startDistance = globeRadius * 6; // Far away from globe
    const finalDistance = globeRadius * 1.25; // Close to the location point
    
    // Calculate positions
    const earthCenter = new THREE.Vector3(0, 0, 0);
    const directionToTarget = new THREE.Vector3().subVectors(target, earthCenter).normalize();
    
    // Position camera in space looking at Earth 
    const outerPosition = new THREE.Vector3().copy(directionToTarget).multiplyScalar(startDistance);
    
    // Define the final camera position based on the target and the final distance
    const finalPosition = new THREE.Vector3().copy(directionToTarget).multiplyScalar(finalDistance);
    
    return { outerPosition, finalPosition };
  }, [globeRadius]);

  return { validateCoordinates, calculateTargetPosition, calculateCameraPositions };
}
