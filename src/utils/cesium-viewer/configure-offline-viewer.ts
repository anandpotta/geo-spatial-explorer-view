
import * as Cesium from 'cesium';
import { configureGlobeAppearance, configureSceneBackground, configureCameraControls } from './globe-configuration';
import { configureAtmosphere, configureRendering } from './atmosphere-configuration';

/**
 * Configures a Cesium viewer for offline mode by disabling all network-dependent features
 */
export function configureOfflineViewer(viewer: Cesium.Viewer): void {
  if (!viewer) {
    console.warn('Invalid viewer object provided to configureOfflineViewer');
    return;
  }
  
  try {
    // 1. Configure globe appearance 
    configureGlobeAppearance(viewer);
    
    // 2. Configure atmosphere
    configureAtmosphere(viewer);
    
    // 3. Configure scene background and celestial bodies
    configureSceneBackground(viewer);
    
    // 4. Configure camera controls
    configureCameraControls(viewer);
    
    // 5. Configure rendering and post-processing
    configureRendering(viewer);
    
    // 6. Force render cycles to ensure visibility
    forceRenderCycles(viewer);
    
    // 7. Position camera for optimal initial view
    positionCameraForInitialView(viewer);
    
    console.log('Cesium viewer configured for optimal offline viewing');
  } catch (e) {
    console.error('Error configuring offline viewer:', e);
  }
}

/**
 * Forces multiple render cycles to ensure the globe is visible
 */
function forceRenderCycles(viewer: Cesium.Viewer): void {
  if (!viewer || viewer.isDestroyed()) return;
  
  // Immediately trigger multiple renders
  for (let i = 0; i < 10; i++) {
    viewer.scene.requestRender();
  }
  
  // Force resize after a short delay
  setTimeout(() => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.resize();
      console.log('Viewer resized to ensure proper canvas dimensions');
      
      // Force additional renders after resize
      for (let i = 0; i < 10; i++) {
        viewer.scene.requestRender();
      }
      
      // Continue rendering at various intervals to ensure visibility
      const intervals = [10, 30, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
      
      intervals.forEach((interval, index) => {
        setTimeout(() => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.scene.requestRender();
            console.log(`Rendering globe at ${interval}ms interval`);
          }
        }, interval);
      });
    }
  }, 100);
}

/**
 * Positions the camera for the optimal initial view
 */
function positionCameraForInitialView(viewer: Cesium.Viewer): void {
  if (!viewer || viewer.isDestroyed()) return;
  
  try {
    // Set camera to view full globe with a safe position that won't cause normalization errors
    const ellipsoidCenter = Cesium.Cartesian3.ZERO;
    const distance = 20000000.0; // 20,000 km - safe distance
    const heading = 0.0;
    const pitch = -0.5; // Slightly look down instead of straight down
    const roll = 0.0;
    
    // Explicitly define a position above the globe
    const cameraPosition = new Cesium.Cartesian3(0, 0, distance);
    
    // Only proceed if we have a valid position
    if (Cesium.Cartesian3.magnitude(cameraPosition) > 0) {
      viewer.camera.setView({
        destination: cameraPosition,
        orientation: {
          heading: heading,
          pitch: pitch,
          roll: roll
        }
      });
      
      // Update and request render
      viewer.scene.requestRender();
    } else {
      console.warn('Could not set initial camera position: invalid coordinates');
    }
  } catch (e) {
    console.error('Error positioning camera:', e);
  }
}
