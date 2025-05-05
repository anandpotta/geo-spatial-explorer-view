import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { EditControl } from "../../LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useDrawToolsOptions } from '../hooks/useDrawToolsOptions';
import { useDrawToolsOptimization } from '../hooks/useDrawToolsOptimization';
import '../DrawToolsStyle.css';  // Import the custom styles
import { ensureEditControlsVisibility } from '../hooks/utils/visibility';

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
  const controlsInitialized = useRef(false);
  
  // Get map instance from feature group
  const map = featureGroup ? (featureGroup as any)._map : null;
  
  // Apply SVG rendering optimizations
  useDrawToolsOptimization(map);
  
  // Get drawing and editing options
  const { editOptions, drawOptions } = useDrawToolsOptions(featureGroup);

  // Force edit controls to be visible with correct width
  useEffect(() => {
    // Immediately ensure controls are visible
    const checkForControls = () => {
      // Search for the controls both by class and by ref
      const controlExists = document.querySelector('.leaflet-draw.leaflet-control') !== null;
      const refExists = editControlRef.current !== null;
      
      if (controlExists || refExists) {
        controlsInitialized.current = true;
        console.log('Leaflet draw controls found, ensuring visibility');
        ensureEditControlsVisibility();
      } else {
        console.log('Leaflet draw controls not found yet');
        if (initializationAttempts.current < 20) {
          initializationAttempts.current += 1;
        } else {
          console.warn('Maximum attempts reached but controls still not found');
        }
      }
    };
    
    // First check immediately
    checkForControls();
    
    // Set up many checks at different intervals and with different methods
    const fastInterval = setInterval(checkForControls, 300);
    const slowInterval = setInterval(ensureEditControlsVisibility, 1000);
    
    // Also check after specific time delays
    const timeouts = [
      setTimeout(() => ensureEditControlsVisibility(), 100),
      setTimeout(() => ensureEditControlsVisibility(), 500),
      setTimeout(() => ensureEditControlsVisibility(), 1000),
      setTimeout(() => ensureEditControlsVisibility(), 2000),
      setTimeout(() => ensureEditControlsVisibility(), 5000)
    ];
    
    // Listen for force show event
    const handleForceShow = () => {
      console.log('Force show leaflet controls event received');
      ensureEditControlsVisibility();
    };
    
    window.addEventListener('force-show-leaflet-controls', handleForceShow);
    
    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
      timeouts.forEach(timeout => clearTimeout(timeout));
      window.removeEventListener('force-show-leaflet-controls', handleForceShow);
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

  // Create styles directly in the DOM to ensure they take precedence
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-draw.leaflet-control {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        z-index: 1000 !important;
        position: absolute !important;
        top: 50px !important;
        right: 10px !important;
        width: 30px !important;
      }
      .leaflet-draw-toolbar {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        background-color: white !important;
        box-shadow: 0 1px 5px rgba(0,0,0,0.4) !important;
        border-radius: 4px !important;
        border: 2px solid rgba(0,0,0,0.2) !important;
      }
      .leaflet-draw-toolbar a {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        background-color: white !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
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
            setTimeout(ensureEditControlsVisibility, 100);
            
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
    <>
      <EditControl
        ref={editControlRef}
        position="topright"
        onCreated={onCreated}
        draw={drawOptions}
        edit={editOptions}
        featureGroup={featureGroup}
      />
      
      {/* Additional rendering hook to ensure controls are visible */}
      {useEffect(() => {
        // Additional check after component is fully rendered
        const timeoutId = setTimeout(() => {
          ensureEditControlsVisibility();
          // Also dispatch event to force SVG path updates
          window.dispatchEvent(new CustomEvent('force-svg-path-update'));
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }, [])}
    </>
  );
});

DrawToolsCore.displayName = 'DrawToolsCore';

export default DrawToolsCore;
