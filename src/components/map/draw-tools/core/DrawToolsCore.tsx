
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
          // Set width and position as requested
          editControlContainer.style.width = '30px'; // Changed from 200px to 30px
          editControlContainer.style.top = '50px'; // Added top position
          editControlContainer.style.display = 'block';
          editControlContainer.style.visibility = 'visible';
          editControlContainer.style.opacity = '1';
          editControlContainer.style.pointerEvents = 'auto';
          editControlContainer.style.zIndex = '9999';
          
          // Make sure all buttons inside are visible and properly sized
          const buttons = editControlContainer.querySelectorAll('a');
          buttons.forEach(button => {
            (button as HTMLElement).style.display = 'inline-block';
            (button as HTMLElement).style.visibility = 'visible';
            (button as HTMLElement).style.opacity = '1';
          });
          
          // Ensure toolbar is visible
          const toolbar = editControlContainer.querySelector('.leaflet-draw-toolbar') as HTMLElement;
          if (toolbar) {
            toolbar.style.display = 'block';
            toolbar.style.visibility = 'visible';
            toolbar.style.opacity = '1';
          }
        }
      } catch (err) {
        console.error('Error ensuring edit controls visibility:', err);
      }
    };
    
    // Call immediately and set up more frequent checks
    ensureEditControlsVisibility();
    const intervalId = setInterval(ensureEditControlsVisibility, 500); // More frequent checks
    
    // Run again after a short delay to handle race conditions
    setTimeout(ensureEditControlsVisibility, 100);
    setTimeout(ensureEditControlsVisibility, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Handle edit mode activation when activeTool changes
  useEffect(() => {
    if (activeTool === 'edit' && editControlRef.current) {
      try {
        const editControl = editControlRef.current;
        const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
        
        if (editHandler && typeof editHandler.enable === 'function') {
          console.log('Activating edit mode based on activeTool change');
          
          // Add a small delay to ensure that the control is ready
          setTimeout(() => {
            if (editHandler._featureGroup) {
              editHandler._featureGroup.eachLayer((layer: any) => {
                if (typeof layer._path !== 'undefined') {
                  editHandler._selectableLayers.addLayer(layer);
                }
              });
            }
            
            editHandler.enable();
            console.log('Edit mode activated successfully');
          }, 200);
        }
      } catch (err) {
        console.error('Error activating edit mode automatically:', err);
      }
    }
  }, [activeTool]);

  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    activateEditMode: () => {
      try {
        if (editControlRef.current) {
          const editControl = editControlRef.current;
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          
          if (editHandler && typeof editHandler.enable === 'function') {
            console.log('Manually activating edit mode');
            
            // First ensure all layers are selected
            if (editHandler._featureGroup) {
              editHandler._featureGroup.eachLayer((layer: any) => {
                if (typeof layer._path !== 'undefined') {
                  editHandler._selectableLayers.addLayer(layer);
                }
              });
            }
            
            // Then enable edit mode
            editHandler.enable();
            
            // Ensure the controls are visible after activation
            setTimeout(() => {
              const editControlContainer = document.querySelector('.leaflet-draw.leaflet-control') as HTMLElement;
              if (editControlContainer) {
                editControlContainer.style.width = '30px'; // Changed from 200px to 30px
                editControlContainer.style.top = '50px'; // Added top position
                editControlContainer.style.display = 'block';
                editControlContainer.style.visibility = 'visible';
                editControlContainer.style.opacity = '1';
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
