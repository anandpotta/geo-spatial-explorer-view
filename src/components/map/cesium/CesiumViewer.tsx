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
    
    // Force globe visibility when initialized
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      forceGlobeVisibility(viewerRef.current);
    }
    
    // Schedule progressive renders with strategic timing
    const renderTimes = [10, 50, 100, 300, 600, 1000, 2000];
    renderTimes.forEach((time) => {
      setTimeout(() => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.scene.requestRender();
          
          // Force globe visibility at each interval
          forceGlobeVisibility(viewerRef.current);
        }
      }, time);
    });
  });

  // Pass the viewer reference to parent component when available
  useEffect(() => {
    if (viewerRef.current && onViewerReady && isInitialized) {
      onViewerReady(viewerRef.current);
      
      // Force globe visibility when passing viewer reference
      forceGlobeVisibility(viewerRef.current);
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
        
        if (renderCount >= 10) {
          // Stop after 10 attempts
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
    }, 500);
    
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
        renderIntervalRef.current = null;
      }
    };
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
