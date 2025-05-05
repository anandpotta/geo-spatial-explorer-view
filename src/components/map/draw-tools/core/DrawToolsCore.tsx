
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { EditControl } from "../../LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useDrawToolsOptions } from '../hooks/useDrawToolsOptions';
import { useDrawToolsOptimization } from '../hooks/useDrawToolsOptimization';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';
import '../DrawToolsStyle.css';  // Import the custom styles

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
  
  // Get drawing and editing options
  const { editOptions, drawOptions } = useDrawToolsOptions(featureGroup);
  
  // Force edit controls to be visible with correct width
  useEffect(() => {
    const ensureEditControlsVisibility = () => {
      try {
        // Find the edit control container
        const editControlContainer = document.querySelector('.leaflet-draw.leaflet-control') as HTMLElement;
        if (editControlContainer) {
          // Set fixed width and ensure visibility
          editControlContainer.style.width = '200px';
          editControlContainer.style.display = 'block';
          editControlContainer.style.visibility = 'visible';
          editControlContainer.style.opacity = '1';
          editControlContainer.style.pointerEvents = 'auto';
          
          // Make sure all buttons inside are visible and properly sized
          const buttons = editControlContainer.querySelectorAll('a');
          buttons.forEach(button => {
            (button as HTMLElement).style.display = 'inline-block';
            (button as HTMLElement).style.visibility = 'visible';
          });
        }
      } catch (err) {
        console.error('Error ensuring edit controls visibility:', err);
      }
    };
    
    // Call immediately and set up interval
    ensureEditControlsVisibility();
    const intervalId = setInterval(ensureEditControlsVisibility, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

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
            
            // Ensure the controls are visible after activation
            setTimeout(() => {
              const editControlContainer = document.querySelector('.leaflet-draw.leaflet-control') as HTMLElement;
              if (editControlContainer) {
                editControlContainer.style.width = '200px';
                editControlContainer.style.display = 'block';
                editControlContainer.style.visibility = 'visible';
              }
            }, 100);
            
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
