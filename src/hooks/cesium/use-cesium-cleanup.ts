
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
      
      // Stop any ongoing camera flights
      if (viewerRef.current.camera && typeof viewerRef.current.camera.cancelFlight === 'function') {
        viewerRef.current.camera.cancelFlight();
      }
      
      // Disable animation to prevent ticking errors during destruction
      if (viewerRef.current.clock) {
        viewerRef.current.clock.shouldAnimate = false;
        viewerRef.current.clock.onTick.removeAll();
      }
      
      // Unsubscribe from all event handlers
      if (viewerRef.current.scene) {
        viewerRef.current.scene.preRender.removeAll();
        viewerRef.current.scene.postRender.removeAll();
      }
      
      // Reset render loop to prevent updates after destruction
      if (viewerRef.current.scene) {
        viewerRef.current.scene.requestRenderMode = true;
      }
      
      // Destroy the viewer with a small delay to allow pending operations to complete
      setTimeout(() => {
        try {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.destroy();
          }
        } catch (e) {
          console.error("Error in delayed viewer destruction:", e);
        }
        viewerRef.current = null;
      }, 50);
    } catch (e) {
      console.error("Error destroying viewer:", e);
      // Still ensure we null out the reference
      viewerRef.current = null;
    }
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
    initTimeoutRef.current = null;
  }
  if (renderTimeoutRef.current) {
    clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = null;
  }
  if (checkRenderIntervalRef.current) {
    clearInterval(checkRenderIntervalRef.current);
    checkRenderIntervalRef.current = null;
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
