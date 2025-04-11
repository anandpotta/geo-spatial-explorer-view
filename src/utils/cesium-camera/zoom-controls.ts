
import * as Cesium from 'cesium';
import { setDefaultCameraView } from './default-view';
import { zoomTo } from './camera-base';

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
