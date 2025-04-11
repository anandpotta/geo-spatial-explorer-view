
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
    
    // Immediately make canvas visible when initialized
    setCanvasVisible(true);
    
    // Force a few renders to ensure the globe appears
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      try {
        viewerRef.current.resize();
        
        // Schedule limited renders with increasing delay
        const renderTimes = [10, 50, 100, 300, 600];
        renderTimes.forEach((time, index) => {
          setTimeout(() => {
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
              viewerRef.current.scene.requestRender();
              
              // Ensure globe is visible
              if (viewerRef.current.scene && viewerRef.current.scene.globe) {
                viewerRef.current.scene.globe.show = true;
              }
            }
          }, time);
        });
      } catch (e) {
        console.error("Error scheduling renders:", e);
      }
    }
  });

  // Pass the viewer reference to parent component when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && isInitialized) {
      onViewerReady(viewerRef.current);
    }
  }, [isInitialized, onViewerReady]);

  // Additional rendering for better globe visibility
  useEffect(() => {
    const viewer = viewerRef.current;
    
    if (!isInitialized || !viewer || viewer.isDestroyed()) {
      return;
    }
    
    // Make globe visible regardless of flight status
    setCanvasVisible(true);
    
    try {
      // Request a single render after flight status changes
      viewer.scene.requestRender();
    } catch (e) {
      console.error("Error in flight effect handler:", e);
    }
  }, [isInitialized, isFlying]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
      }
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
          zIndex: 1,
          visibility: 'visible', // Always keep the container visible
          minHeight: '400px',
          display: 'block',
          opacity: canvasVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
        data-cesium-container="true"
      />
    </>
  );
};

export default CesiumViewer;
