
import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

/**
 * Hook to handle auto-rotation of the Cesium globe
 */
export const useCesiumAutoRotation = (
  isInitialized: boolean, 
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>,
  isFlying: boolean
) => {
  const autoRotationActive = useRef(true);
  
  // Setup auto-rotation for more dynamic globe
  useEffect(() => {
    if (isInitialized && viewerRef.current && !viewerRef.current.isDestroyed()) {
      // Enable auto-rotation
      viewerRef.current.clock.shouldAnimate = true;
      viewerRef.current.scene.screenSpaceCameraController.enableRotate = true;
      
      // Add automated camera rotation with increased speed
      let lastTime = Date.now();
      const rotationSpeed = 1.0; // Increased speed for more noticeable rotation
      
      const autoRotateListener = viewerRef.current.clock.onTick.addEventListener(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed() && autoRotationActive.current) {
          const now = Date.now();
          const delta = (now - lastTime) / 1000; // seconds
          lastTime = now;
          
          // Rotate the camera around the globe
          viewerRef.current.scene.camera.rotate(
            Cesium.Cartesian3.UNIT_Z,
            Cesium.Math.toRadians(rotationSpeed * delta)
          );
          
          // Force a render
          viewerRef.current.scene.requestRender();
        }
      });
      
      return () => {
        if (autoRotateListener) {
          viewerRef.current?.clock.onTick.removeEventListener(autoRotateListener);
        }
      };
    }
  }, [isInitialized, viewerRef]);

  // Stop auto-rotation when flying to a location
  useEffect(() => {
    autoRotationActive.current = !isFlying;
    
    // If we finished flying, restart auto-rotation
    if (!isFlying && viewerRef.current && !viewerRef.current.isDestroyed()) {
      setTimeout(() => {
        autoRotationActive.current = true;
      }, 500);
    }
  }, [isFlying, viewerRef]);
};
