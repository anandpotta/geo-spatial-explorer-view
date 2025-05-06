import * as Cesium from 'cesium';
import { Location } from './geo-utils';

/**
 * Enhanced function to fly to a location with better error handling
 */
export function flyToLocation(
  viewer: Cesium.Viewer, 
  location: Location, 
  entityRef: React.MutableRefObject<Cesium.Entity | null>,
  options: {
    cinematic?: boolean;
    duration?: number;
    onComplete?: () => void;
  } = {}
): void {
  if (!viewer || viewer.isDestroyed()) {
    console.warn('Cannot fly to location: viewer is not available');
    if (options.onComplete) setTimeout(options.onComplete, 100);
    return;
  }

  // Validate coordinates to prevent normalization errors
  if (!isValidCoordinate(location.x) || !isValidCoordinate(location.y)) {
    console.warn(`Invalid coordinates for camera flight: x=${location.x}, y=${location.y}`);
    if (options.onComplete) setTimeout(options.onComplete, 100);
    return;
  }

  try {
    // Default options
    const {
      cinematic = true,
      duration = 2.0,
      onComplete
    } = options;

    // Create or update entity at that location
    let entity = entityRef.current;

    // If we have an existing entity, update it rather than creating a new one
    if (!entity || entity.isDestroyed) {
      entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(location.x, location.y),
        point: {
          pixelSize: 10,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        name: location.label || 'Selected Location'
      });
      
      entityRef.current = entity;
    } else {
      // Just update the position
      entity.position = new Cesium.ConstantPositionProperty(
        Cesium.Cartesian3.fromDegrees(location.x, location.y)
      );
    }

    // Safe height value
    const height = 500000.0;

    if (!cinematic) {
      // Directly set camera position without animation for immediate view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          location.x,
          location.y,
          height
        )
      });

      // Force immediate render
      viewer.scene.requestRender();
      
      // Call completion handler after a short delay
      if (onComplete) {
        setTimeout(onComplete, 100);
      }
    } else {
      // Use cinematic flight animation
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          location.x,
          location.y,
          height
        ),
        duration,
        complete: onComplete,
        // Use simpler easing function to avoid normalization issues
        easingFunction: Cesium.EasingFunction.LINEAR_NONE
      });

      // Force multiple renders to ensure the globe is visible during flight
      for (let i = 0; i < 5; i++) {
        viewer.scene.requestRender();
      }
    }
  } catch (error) {
    console.error('Error during camera flight:', error);
    // Still call completion handler even if there's an error
    if (options.onComplete) {
      setTimeout(options.onComplete, 100);
    }
  }
}

/**
 * Helper function to check if a coordinate is valid (not NaN, Infinity, etc.)
 */
export function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

/**
 * Safe function to calculate Cartesian3 magnitude with error handling
 */
export function safeCartesianMagnitude(cartesian: Cesium.Cartesian3): number {
  if (!cartesian || 
      !isValidCoordinate(cartesian.x) || 
      !isValidCoordinate(cartesian.y) || 
      !isValidCoordinate(cartesian.z)) {
    return 0;
  }
  
  try {
    return Cesium.Cartesian3.magnitude(cartesian);
  } catch (e) {
    console.warn('Error calculating Cartesian magnitude:', e);
    return 0;
  }
}

/**
 * Safely position camera with validation
 */
export function safeSetCamera(
  viewer: Cesium.Viewer, 
  position: Cesium.Cartesian3,
  orientation?: { heading?: number; pitch?: number; roll?: number }
): boolean {
  if (!viewer || viewer.isDestroyed()) return false;
  
  try {
    // Validate the position
    if (safeCartesianMagnitude(position) <= 0) {
      console.warn('Invalid camera position detected');
      return false;
    }
    
    // If orientation is not provided, keep the current one
    const currentHeading = viewer.camera.heading;
    const currentPitch = viewer.camera.pitch;
    const currentRoll = viewer.camera.roll;
    
    viewer.camera.setView({
      destination: position,
      orientation: {
        heading: orientation?.heading ?? currentHeading,
        pitch: orientation?.pitch ?? currentPitch,
        roll: orientation?.roll ?? currentRoll
      }
    });
    
    // Force render after camera change
    viewer.scene.requestRender();
    return true;
  } catch (error) {
    console.error('Error setting camera position:', error);
    return false;
  }
}

/**
 * Forces globe visibility through multiple render cycles
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || viewer.isDestroyed()) return;
  
  try {
    // Make sure globe is visible
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      
      // Set a vibrant base color to ensure visibility
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.5, 1.0, 1.0);
    }
    
    // Force multiple renders
    for (let i = 0; i < 10; i++) {
      viewer.scene.requestRender();
    }
    
    // Force a resize to ensure proper canvas dimensions
    viewer.resize();
    
    // Request more renders after a short delay
    setTimeout(() => {
      if (!viewer.isDestroyed()) {
        for (let i = 0; i < 5; i++) {
          viewer.scene.requestRender();
        }
      }
    }, 200);
  } catch (e) {
    console.error('Error forcing globe visibility:', e);
  }
}
