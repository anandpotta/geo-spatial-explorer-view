
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import CesiumMapLoading from '@/components/map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/cesium';
import { forceGlobeVisibility } from '@/utils/cesium-viewer';

interface CesiumViewerProps {
  isFlying: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
  onMapReady?: () => void;
}

const CesiumViewer = ({ isFlying, onViewerReady, onMapReady }: CesiumViewerProps) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [canvasVisible, setCanvasVisible] = useState(true); // Always true by default
  const renderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRotationActive = useRef(true);
  const hasInitializedRef = useRef(false);
  
  // Use the Cesium map hook
  const { 
    viewerRef, 
    entityRef, 
    isLoadingMap, 
    mapError,
    isInitialized
  } = useCesiumMap(cesiumContainer, () => {
    if (onMapReady) {
      onMapReady();
    }
    
    // Immediately make canvas visible when initialized
    setCanvasVisible(true);
    
    // Force globe visibility when initialized
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      forceGlobeVisibility(viewerRef.current);
      
      // Force resize to ensure proper dimensions
      viewerRef.current.resize();
    }
    
    // Schedule aggressive renders with more frequent timing
    const renderTimes = [10, 30, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000];
    renderTimes.forEach((time) => {
      setTimeout(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          // Force a render
          viewerRef.current.scene.requestRender();
          
          // Force globe visibility
          forceGlobeVisibility(viewerRef.current);
          
          // Force resize periodically
          if (time % 500 === 0) {
            viewerRef.current.resize();
          }
        }
      }, time);
    });
  });

  // Pass the viewer reference to parent when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && isInitialized) {
      onViewerReady(viewerRef.current);
      
      // Force globe visibility when passing viewer reference
      forceGlobeVisibility(viewerRef.current);
      
      // Force resize to ensure proper dimensions
      viewerRef.current.resize();
      
      console.log('Viewer ready and passed to parent, canvas: ', 
        viewerRef.current.canvas ? 
        `${viewerRef.current.canvas.width}x${viewerRef.current.canvas.height}` : 
        'no canvas');
    }
  }, [isInitialized, onViewerReady]);

  // Additional rendering cycle to ensure visibility
  useEffect(() => {
    const viewer = viewerRef.current;
    
    if (!isInitialized || !viewer || viewer.isDestroyed()) {
      return;
    }
    
    // Make absolutely sure the globe is visible
    setCanvasVisible(true);
    
    // Clear any previous render interval
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
    }
    
    // Force globe visibility
    forceGlobeVisibility(viewer);
    
    // Set up a short interval to keep forcing visibility for a few seconds
    let renderCount = 0;
    renderIntervalRef.current = setInterval(() => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        forceGlobeVisibility(viewerRef.current);
        renderCount++;
        
        // For the first several renders, also force resize
        if (renderCount < 20) {
          viewerRef.current.resize();
        }
        
        if (renderCount >= 60) { // Keep trying longer
          if (renderIntervalRef.current) {
            clearInterval(renderIntervalRef.current);
            renderIntervalRef.current = null;
          }
        }
      } else {
        // Stop if viewer is destroyed
        if (renderIntervalRef.current) {
          clearInterval(renderIntervalRef.current);
          renderIntervalRef.current = null;
        }
      }
    }, 100); // More frequent checks
    
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
        renderIntervalRef.current = null;
      }
    };
  }, [isInitialized, isFlying]);

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
  }, [isInitialized]);

  // Stop auto-rotation when flying to a location
  useEffect(() => {
    autoRotationActive.current = !isFlying;
    
    // If we finished flying, restart auto-rotation
    if (!isFlying && viewerRef.current && !viewerRef.current.isDestroyed()) {
      setTimeout(() => {
        autoRotationActive.current = true;
      }, 500);
    }
  }, [isFlying]);
  
  // Force visibility on container and all canvas elements
  useEffect(() => {
    // Initial setup for container
    if (cesiumContainer.current) {
      cesiumContainer.current.style.visibility = 'visible';
      cesiumContainer.current.style.display = 'block';
      cesiumContainer.current.style.opacity = '1';
      cesiumContainer.current.style.zIndex = '1000'; // Increased z-index
    }
    
    // Function to check and fix canvas visibility
    const checkCanvases = () => {
      if (cesiumContainer.current) {
        const canvases = cesiumContainer.current.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          canvas.style.visibility = 'visible';
          canvas.style.display = 'block';
          canvas.style.opacity = '1';
          canvas.style.zIndex = '1000'; // Higher z-index for visibility
        });
      }
    };
    
    // Check repeatedly and for longer duration
    const canvasInterval = setInterval(checkCanvases, 100);
    setTimeout(() => {
      clearInterval(canvasInterval);
    }, 10000); // Check for longer (10 seconds)
    
    return () => {
      clearInterval(canvasInterval);
    };
  }, []);
  
  return (
    <>
      <CesiumMapLoading isLoading={isLoadingMap} mapError={mapError} />
      <div 
        ref={cesiumContainer} 
        className="w-full h-full cesium-container"
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
          zIndex: 1000, // Increased z-index
          visibility: 'visible', // Always visible
          opacity: 1,
          transition: 'opacity 0.3s ease-in-out',
          minHeight: '500px',
          display: 'block',
          background: 'black' // Black background for contrast
        }}
        data-cesium-container="true"
      />
    </>
  );
};

export default CesiumViewer;
