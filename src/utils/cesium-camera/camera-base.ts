
import * as Cesium from 'cesium';
import { Location } from '../geo-utils';

export interface CameraFlightOptions {
  duration?: number;
  height?: number;
  onComplete?: () => void;
  cinematic?: boolean;
}

/**
 * Flies the camera to a specified location
 */
export function flyToLocation(
  viewer: Cesium.Viewer,
  location: Location,
  options: CameraFlightOptions = {}
): Promise<void> {
  const {
    duration = 2.0,
    height = 500000.0,
    cinematic = true,
  } = options;

  return new Promise((resolve) => {
    try {
      // Validate the location first to prevent normalization errors
      if (!isValidCoordinate(location.x) || !isValidCoordinate(location.y)) {
        console.warn(`Invalid coordinates for camera flight: x=${location.x}, y=${location.y}`);
        setTimeout(() => resolve(), 100);
        return;
      }
      
      if (!cinematic) {
        // Directly set camera position without animation
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            location.x,
            location.y,
            height
          )
        });
        
        // Force render
        viewer.scene.requestRender();
        
        // Resolve immediately
        setTimeout(() => resolve(), 100);
      } else {
        // Use cinematic flight animation
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            location.x,
            location.y,
            height
          ),
          duration,
          complete: () => resolve(),
          easingFunction: Cesium.EasingFunction.LINEAR_NONE // Simplest easing function
        });
      }
    } catch (error) {
      console.error('Error during camera flight:', error);
      // Still resolve the promise even if there's an error
      resolve();
    }
  });
}

/**
 * Zooms the camera to a specified height at the current position
 */
export function zoomTo(viewer: Cesium.Viewer, heightInMeters: number): void {
  try {
    const currentPosition = viewer.camera.positionCartographic;
    
    // Validate position
    if (!currentPosition || !isValidCoordinate(currentPosition.longitude) || !isValidCoordinate(currentPosition.latitude)) {
      console.warn('Invalid camera position for zoom operation');
      return;
    }
    
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(
        currentPosition.longitude,
        currentPosition.latitude,
        heightInMeters
      ),
      duration: 1.0
    });
  } catch (error) {
    console.error('Error during zoom operation:', error);
  }
}

/**
 * Helper function to check if a coordinate is valid (not NaN, Infinity, etc.)
 */
function isValidCoordinate(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}
