
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { EditControl } from "../../LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useDrawToolsOptions } from '../hooks/useDrawToolsOptions';
import { useDrawToolsOptimization } from '../hooks/useDrawToolsOptimization';
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
  const initializationAttempts = useRef(0);
  
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
          editControlContainer.style.width = '30px';
          editControlContainer.style.top = '50px';
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
          
          // Make edit and delete buttons specifically visible
          const editEditBtn = editControlContainer.querySelector('.leaflet-draw-edit-edit') as HTMLElement;
          if (editEditBtn) {
            editEditBtn.style.display = 'inline-block';
            editEditBtn.style.visibility = 'visible';
            editEditBtn.style.opacity = '1';
          }
          
          const editDeleteBtn = editControlContainer.querySelector('.leaflet-draw-edit-remove') as HTMLElement;
          if (editDeleteBtn) {
            editDeleteBtn.style.display = 'inline-block';
            editDeleteBtn.style.visibility = 'visible';
            editDeleteBtn.style.opacity = '1';
          }
        }
      } catch (err) {
        console.error('Error ensuring edit controls visibility:', err);
      }
    };
    
    // More aggressive approach to ensure edit controls visibility
    // Call immediately
    ensureEditControlsVisibility();
    
    // Set up multiple checks at different intervals
    const fastIntervalId = setInterval(ensureEditControlsVisibility, 500);
    const slowIntervalId = setInterval(ensureEditControlsVisibility, 2000);
    
    // Also run after specific delays to catch various timing issues
    setTimeout(ensureEditControlsVisibility, 100);
    setTimeout(ensureEditControlsVisibility, 500);
    setTimeout(ensureEditControlsVisibility, 1000);
    setTimeout(ensureEditControlsVisibility, 3000);
    
    return () => {
      clearInterval(fastIntervalId);
      clearInterval(slowIntervalId);
    };
  }, []);
  
  // Enhanced check for edit control initialization
  useEffect(() => {
    const checkEditControlInitialization = () => {
      if (!editControlRef.current) return false;
      
      try {
        const editControl = editControlRef.current;
        // Debug output of edit control internal structure
        if (initializationAttempts.current % 5 === 0) { // Log only occasionally
          console.log('Edit control structure check:', {
            hasToolbars: !!editControl._toolbars,
            editToolbar: !!editControl._toolbars?.edit, 
            editModes: !!editControl._toolbars?.edit?._modes,
            editHandler: !!editControl._toolbars?.edit?._modes?.edit?.handler
          });
        }
        
        initializationAttempts.current += 1;
        
        // Return success if edit toolbar is properly initialized
        return !!editControl._toolbars?.edit?._modes?.edit?.handler;
      } catch (err) {
        console.error('Error checking edit control initialization:', err);
        return false;
      }
    };
    
    // Check initialization status on a schedule
    const initCheckId = setInterval(() => {
      if (checkEditControlInitialization()) {
        clearInterval(initCheckId);
        console.log('Edit control successfully initialized');
      } else if (initializationAttempts.current > 20) {
        clearInterval(initCheckId);
        console.log('Maximum edit control initialization checks reached');
      }
    }, 500);
    
    return () => {
      clearInterval(initCheckId);
    };
  }, [editControlRef.current]);

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
          }, 500);
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
                editControlContainer.style.width = '30px';
                editControlContainer.style.top = '50px';
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
