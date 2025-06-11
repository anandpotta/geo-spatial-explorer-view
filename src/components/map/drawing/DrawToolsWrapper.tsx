import React, { ForwardedRef, useEffect } from 'react';
import DrawTools from '../DrawTools';
import L from 'leaflet';
import { ensureFeatureGroupMethods } from '@/utils/leaflet-layer-patch';
import { patchLeafletDraw } from '@/hooks/useDrawToolsConfiguration';
import { configureSvgRenderer } from '@/utils/draw-tools-utils';
import { setupDrawingPathObserver } from './LayerAttributeManager';

interface DrawToolsWrapperProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

// Using forwardRef properly without trying to assign it to a FC type directly
const DrawToolsWrapper = React.forwardRef<any, DrawToolsWrapperProps>(({
  onCreated,
  activeTool,
  onClearAll,
  featureGroup
}, ref) => {
  // Apply patches when component mounts
  useEffect(() => {
    // Apply leaflet-draw patches to fix type errors
    patchLeafletDraw();
    
    // Configure SVG renderer to improve path rendering
    const cleanup = configureSvgRenderer();
    
    // Set up the drawing path observer
    const cleanupObserver = setupDrawingPathObserver();
    
    // Patch the GeometryUtil.readableArea method to prevent "type is not defined" error
    if (L.GeometryUtil && L.GeometryUtil.readableArea) {
      const originalReadableArea = L.GeometryUtil.readableArea;
      L.GeometryUtil.readableArea = function(area, isMetric, precision) {
        try {
          return originalReadableArea.call(this, area, isMetric, precision);
        } catch (err) {
          // Provide fallback implementation
          const factor = isMetric ? 1 : 10.764;
          const areaDisplay = Math.round(area * factor);
          const unit = isMetric ? 'm²' : 'ft²';
          return areaDisplay + ' ' + unit;
        }
      };
    }
    
    // Explicitly configure Circle to use SVG renderer
    if (L.Draw && L.Draw.Circle) {
      const circleProto = L.Draw.Circle.prototype as any;
      if (circleProto && circleProto.options) {
        circleProto.options.shapeOptions = {
          ...circleProto.options.shapeOptions,
          renderer: L.svg(),
          stroke: true,
          opacity: 1
        };
      }
    }
    
    return () => {
      if (cleanup) cleanup();
      if (cleanupObserver) cleanupObserver();
    };
  }, []);
  
  if (!featureGroup) {
    console.warn('DrawToolsWrapper: featureGroup is not defined');
    return null;
  }
  
  // Ensure the featureGroup has all required methods before passing it to DrawTools
  const patchedFeatureGroup = ensureFeatureGroupMethods(featureGroup);
  
  return (
    <DrawTools 
      onCreated={onCreated} 
      activeTool={activeTool} 
      onClearAll={onClearAll}
      featureGroup={patchedFeatureGroup}
      ref={ref}
    />
  );
});

DrawToolsWrapper.displayName = 'DrawToolsWrapper';

export default DrawToolsWrapper;
