
import React, { ForwardedRef } from 'react';
import DrawTools from '../DrawTools';
import L from 'leaflet';

interface DrawToolsWrapperProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

// Using forwardRef properly with explicit types
const DrawToolsWrapper = React.forwardRef<any, DrawToolsWrapperProps>(({
  onCreated,
  activeTool,
  onClearAll,
  featureGroup
}, ref) => {
  // Now we pass the onToolSelect prop that DrawTools requires
  const handleToolSelect = (tool: string) => {
    console.log('Tool selected:', tool);
  };
  
  return (
    <DrawTools 
      onToolSelect={handleToolSelect}
      onZoomIn={() => featureGroup && (featureGroup as any)._map?.zoomIn()}
      onZoomOut={() => featureGroup && (featureGroup as any)._map?.zoomOut()}
      onReset={() => {
        if (featureGroup && (featureGroup as any)._map) {
          const map = (featureGroup as any)._map;
          map.setView([51.505, -0.09], 13); // Default view
        }
      }}
      onClearAll={onClearAll}
    />
  );
});

DrawToolsWrapper.displayName = 'DrawToolsWrapper';

export default DrawToolsWrapper;
