
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
    
    // 6. Force resize after a short delay
    setTimeout(() => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.resize();
        console.log('Viewer resized to ensure proper canvas dimensions');
        
        // Force additional renders after resize
        for (let i = 0; i < 10; i++) {
          viewer.scene.requestRender();
        }
      }
    }, 100);
  } catch (e) {
    console.error('Error configuring offline viewer:', e);
  }
}
