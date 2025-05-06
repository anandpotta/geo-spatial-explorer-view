
import React, { ForwardedRef } from 'react';
import DrawTools from '../DrawTools';
import L from 'leaflet';

interface DrawToolsWrapperProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
  ref: ForwardedRef<any>;
}

const DrawToolsWrapper: React.FC<DrawToolsWrapperProps> = React.forwardRef(({
  onCreated,
  activeTool,
  onClearAll,
  featureGroup
}, ref) => {
  return (
    <DrawTools 
      ref={ref}
      onCreated={onCreated} 
      activeTool={activeTool} 
      onClearAll={onClearAll}
      featureGroup={featureGroup}
    />
  );
});

DrawToolsWrapper.displayName = 'DrawToolsWrapper';

export default DrawToolsWrapper;
