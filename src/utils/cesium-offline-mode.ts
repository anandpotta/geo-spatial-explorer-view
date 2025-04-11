
import * as Cesium from 'cesium';
import { patchCesiumToPreventNetworkRequests, patchCesiumProviders } from './cesium-network-patches';
import { createOfflineCesiumViewerOptions, configureOfflineViewer } from './cesium-viewer';

/**
 * Prepares Cesium for offline mode by applying all necessary patches
 */
export function setupCesiumOfflineMode(): void {
  // Disable Ion completely
  try {
    Cesium.Ion.defaultAccessToken = '';
    
    // Disable Cesium's IAU data loading which is causing the errors
    if ((Cesium as any).Iau2006XysData) {
      (Cesium as any).Iau2006XysData.prototype.preload = function() {
        return Promise.resolve();
      };
      
      (Cesium as any).Iau2006XysData.prototype.computeXysRadians = function() {
        return {
          x: 0,
          y: 0,
          s: 0
        };
      };
    }
  } catch (e) {
    console.error('Could not set Ion token:', e);
  }
  
  // Apply all patches
  patchCesiumToPreventNetworkRequests();
  patchCesiumProviders();
  
  console.log('Cesium offline mode setup complete');
}

// Re-export all necessary functions
export {
  patchCesiumToPreventNetworkRequests,
  patchCesiumProviders,
  createOfflineCesiumViewerOptions,
  configureOfflineViewer
};
