
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
    // Position the camera to show North America view similar to the reference image
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-115.0, 35.0, 20000000.0), // Position over North America
      orientation: {
        heading: 0.0,
        pitch: -0.5,  // Look down at the globe
        roll: 0.0
      }
    });
    
    // Ensure Earth rotation is on but at a reasonable speed
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 100; // Slower rotation speed
    
    // Set the scene background to black for space effect
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Make sure globe is visible with explicit settings
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      
      // Configure globe appearance to match the reference image
      viewer.scene.globe.baseColor = Cesium.Color.BLUE.withAlpha(1.0); // Solid blue base color
      
      // Add atmosphere effect for the blue glow on the edges
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 0.8;
      }
      
      // Disable fog which can interfere with visibility
      viewer.scene.fog.enabled = false;
      
      // Enhanced lighting for better terrain visibility
      viewer.scene.globe.enableLighting = true;
    }
    
    console.log('Default North America view set successfully at height: 20000000.0m');
    
    // Force additional renders to ensure the globe appears
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
    
    // Schedule additional renders after a delay to ensure the globe is fully loaded
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        for (let i = 0; i < 10; i++) {
          viewer.scene.requestRender();
        }
      }
    }, 500);
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
