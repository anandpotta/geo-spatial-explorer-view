import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import CesiumMapLoading from '@/components/map/CesiumMapLoading';
import { useCesiumMap } from '@/hooks/cesium';

interface CesiumViewerProps {
  isFlying: boolean;
  onViewerReady?: (viewer: Cesium.Viewer) => void;
  onMapReady?: () => void;
}

const CesiumViewer = ({ isFlying, onViewerReady, onMapReady }: CesiumViewerProps) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const forceRenderCount = useRef(0);
  const renderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
    
    // Set a more conservative rendering schedule to ensure the globe appears
    // without causing reference errors
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
      renderIntervalRef.current = null;
    }
    
    // Use setTimeout instead of interval to reduce the risk of errors
    const scheduleRender = (iteration: number, maxIterations: number = 20) => {
      if (iteration >= maxIterations) return;
      
      setTimeout(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          try {
            // Force resize
            viewerRef.current.resize();
            viewerRef.current.scene.requestRender();
            
            // Ensure globe is visible with proper color
            if (viewerRef.current.scene && viewerRef.current.scene.globe) {
              viewerRef.current.scene.globe.show = true;
              const colorIntensity = Math.min(1.0, 0.6 + (iteration * 0.02));
              viewerRef.current.scene.globe.baseColor = new Cesium.Color(0.0, colorIntensity, 1.0, 1.0);
            }
            
            // Schedule next render if viewer still exists
            if (!viewerRef.current.isDestroyed()) {
              scheduleRender(iteration + 1, maxIterations);
            }
          } catch (e) {
            console.error("Error during scheduled render:", e);
          }
        }
      }, 75 + (iteration * 25)); // Gradually increase delay
    };
    
    // Start the render scheduling with iteration 0
    scheduleRender(0);
    
    // Immediately make canvas visible when initialized
    setCanvasVisible(true);
  });

  // Clean up render interval on unmount
  useEffect(() => {
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
        renderIntervalRef.current = null;
      }
    };
  }, []);

  // Pass the viewer reference to parent component when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && isInitialized) {
      onViewerReady(viewerRef.current);
      
      // Force immediate renders when viewer is available - but keep it minimal
      try {
        for (let i = 0; i < 3; i++) {
          viewerRef.current.scene.requestRender();
        }
      } catch (e) {
        console.error("Error requesting renders:", e);
      }
    }
  }, [isInitialized, onViewerReady]);

  // Additional rendering for better globe visibility during and after flights
  useEffect(() => {
    const viewer = viewerRef.current;
    
    if (!isInitialized || !viewer || viewer.isDestroyed()) {
      return;
    }
    
    // Make globe visible regardless of flight status
    setCanvasVisible(true);
    
    try {
      // Additional renders to ensure visibility - keep it minimal
      viewer.resize();
      viewer.scene.requestRender();
      
      // Ensure globe is visible
      if (viewer.scene && viewer.scene.globe) {
        viewer.scene.globe.show = true;
        viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.7, 1.0, 1.0); // Brighter blue
      }
    } catch (e) {
      console.error("Error in flight effect handler:", e);
    }
  }, [isInitialized, isFlying]);
  
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
          zIndex: 1,
          visibility: 'visible', // Always keep visible for better renders
          minHeight: '400px',
          display: 'block',
          opacity: canvasVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out' // Faster transition
        }}
        data-cesium-container="true"
      />
    </>
  );
};

export default CesiumViewer;
