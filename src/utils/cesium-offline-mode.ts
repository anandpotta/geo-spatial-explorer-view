
import * as Cesium from 'cesium';
import { patchCesiumToPreventNetworkRequests, patchCesiumProviders } from './cesium-network-patches';
import { createOfflineCesiumViewerOptions, configureOfflineViewer } from './cesium-viewer-config';

/**
 * Prepares Cesium for offline mode by applying all necessary patches
 */
export function setupCesiumOfflineMode(): void {
  // Disable Ion completely
  try {
    Cesium.Ion.defaultAccessToken = '';
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
