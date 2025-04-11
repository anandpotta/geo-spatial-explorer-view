
import * as Cesium from 'cesium';

/**
 * Safely destroys a Cesium viewer instance
 */
export function destroyViewer(viewerRef: React.MutableRefObject<Cesium.Viewer | null>): void {
  if (viewerRef.current && !viewerRef.current.isDestroyed()) {
    console.log("Destroying previous Cesium viewer");
    try {
      // First clear any entities which might cause errors
      viewerRef.current.entities.removeAll();
      
      // Safely destroy viewer
      viewerRef.current.destroy();
    } catch (e) {
      console.error("Error destroying viewer:", e);
    }
    viewerRef.current = null;
  }
}

/**
 * Cleans up timeouts and intervals
 */
export function cleanupTimeouts(
  initTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  renderTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  checkRenderIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>
): void {
  if (initTimeoutRef.current) {
    clearTimeout(initTimeoutRef.current);
  }
  if (renderTimeoutRef.current) {
    clearTimeout(renderTimeoutRef.current);
  }
  if (checkRenderIntervalRef.current) {
    clearInterval(checkRenderIntervalRef.current);
  }
}

/**
 * Checks if we have a valid viewer and container
 */
export function checkViewerStatus(
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  cesiumContainer: React.RefObject<HTMLDivElement>
): boolean {
  if (viewerRef.current && !viewerRef.current.isDestroyed() && cesiumContainer.current) {
    return true;
  }
  return false;
}
