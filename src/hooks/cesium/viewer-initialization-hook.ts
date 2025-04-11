
import * as Cesium from 'cesium';
import { ViewerInitializationOptions } from './initialization-types';
import { initializeViewer } from './viewer-initialization';

/**
 * Initializes Cesium viewer with a container check
 */
export function initializeCesiumViewer(options: ViewerInitializationOptions): void {
  const {
    cesiumContainer,
    initTimeoutRef,
  } = options;

  if (!cesiumContainer.current) {
    console.log("No container element available for Cesium viewer");
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    initTimeoutRef.current = setTimeout(() => initializeCesiumViewer(options), 200);
    return;
  }
  
  // Container exists, proceed with initialization
  initializeViewer(options);
}
