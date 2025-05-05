
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { EditControl } from "../LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useDrawToolsOptions } from '../draw-tools/hooks/useDrawToolsOptions';
import { useEditMode } from '../draw-tools/hooks/useEditMode';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';
import { useDrawToolsOptimization } from '../draw-tools/hooks/useDrawToolsOptimization';

interface DrawToolsCoreProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawToolsCore = forwardRef(({ 
  onCreated, 
  activeTool, 
  featureGroup 
}: DrawToolsCoreProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Get map instance from feature group
  const map = featureGroup ? (featureGroup as any)._map : null;
  
  // Apply SVG rendering optimizations
  useDrawToolsOptimization(map);
  
  // Handle edit mode activation
  useEditMode(editControlRef, activeTool);
  
  // Get drawing and editing options
  const { editOptions, drawOptions } = useDrawToolsOptions(featureGroup);

  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    activateEditMode: () => {
      try {
        if (editControlRef.current) {
          const editControl = editControlRef.current;
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          
          if (editHandler && typeof editHandler.enable === 'function') {
            console.log('Manually activating edit mode');
            editHandler.enable();
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('Error manually activating edit mode:', err);
        return false;
      }
    }
  }));

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={onCreated}
      draw={drawOptions}
      edit={editOptions}
      featureGroup={featureGroup}
    />
  );
});

DrawToolsCore.displayName = 'DrawToolsCore';

export default DrawToolsCore;
