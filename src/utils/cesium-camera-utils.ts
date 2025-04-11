
import * as Cesium from 'cesium';
import { Location } from './geo-utils';

export interface CameraFlightOptions {
  duration?: number;
  height?: number;
  onComplete?: () => void;
  cinematic?: boolean;
}

/**
 * Sets an initial default view for the Cesium camera
 */
export function setDefaultCameraView(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.camera) {
    console.warn('Invalid viewer or camera for default view');
    return;
  }

  try {
    // Position the camera to see a good view of Earth
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 15000000.0), // Closer view than before
      orientation: {
        heading: 0.0,
        pitch: -0.5, // Less extreme angle to see more of the globe
        roll: 0.0
      }
    });
    
    // Ensure Earth rotation is on but slower for stability
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 500; // Slower rotation
    
    // Force immediate rendering with more render requests
    for (let i = 0; i < 10; i++) {
      viewer.scene.requestRender();
    }

    // Make sure globe is visible with explicit settings
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = Cesium.Color.BLUE.withAlpha(0.95); // More visible blue color
      
      // Disable things that might interfere with visibility
      viewer.scene.globe.enableLighting = false;
      viewer.scene.fog.enabled = false;
    }
    
    console.log('Default Earth view set successfully at height: 15000000.0m');
    
    // Schedule additional renders after a delay
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        for (let i = 0; i < 5; i++) {
          viewer.scene.requestRender();
        }
      }
    }, 300);
  } catch (error) {
    console.error('Failed to set default camera view:', error);
  }
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
  const currentPosition = viewer.camera.positionCartographic;
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromRadians(
      currentPosition.longitude,
      currentPosition.latitude,
      heightInMeters
    ),
    duration: 1.0
  });
}

/**
 * Resets the camera to the default view
 */
export function resetCamera(viewer: Cesium.Viewer): void {
  setDefaultCameraView(viewer);
}

/**
 * Zooms in the camera by a multiplier of the current height
 */
export function zoomIn(viewer: Cesium.Viewer, factor: number = 0.5): void {
  if (!viewer || !viewer.camera) return;
  
  const currentPosition = viewer.camera.positionCartographic;
  const newHeight = currentPosition.height * factor;
  
  zoomTo(viewer, newHeight);
  console.log(`Zoomed in to height: ${newHeight.toFixed(2)}m`);
}

/**
 * Zooms out the camera by a multiplier of the current height
 */
export function zoomOut(viewer: Cesium.Viewer, factor: number = 2.0): void {
  if (!viewer || !viewer.camera) return;
  
  const currentPosition = viewer.camera.positionCartographic;
  const newHeight = currentPosition.height * factor;
  
  zoomTo(viewer, newHeight);
  console.log(`Zoomed out to height: ${newHeight.toFixed(2)}m`);
}
