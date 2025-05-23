
import React, { ForwardedRef } from 'react';
import DrawTools from '../DrawTools';
import L from 'leaflet';
import { ensureFeatureGroupMethods } from '@/utils/leaflet-layer-patch';

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
