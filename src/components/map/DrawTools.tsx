import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawToolsConfiguration } from '@/hooks/useDrawToolsConfiguration';
import { useDrawToolsEventHandlers } from '@/hooks/useDrawToolsEventHandlers';
import { useSavedPathsRestoration } from '@/hooks/useSavedPathsRestoration';
import { usePathElementsCleaner } from '@/hooks/usePathElementsCleaner';
import { getDrawOptions } from './drawing/DrawOptionsConfiguration';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import { useClearAllOperation } from '@/hooks/useClearAllOperation';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// Import leaflet CSS directly
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  const initializedRef = useRef<boolean>(false);
  const [hasLayers, setHasLayers] = useState(false);
  const zoomControlsAddedRef = useRef<boolean>(false);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Use the clear all operation hook
  const { 
    showConfirmation, 
    setShowConfirmation, 
    confirmClearAll 
  } = useClearAllOperation(() => {
    // Perform additional SVG cleanup when clear all is confirmed
    if (featureGroup && (featureGroup as any)._map) {
      clearAllMapSvgElements((featureGroup as any)._map);
    }
    
    // Manual cleanup of any remaining SVG paths
    setTimeout(() => {
      document.querySelectorAll('.leaflet-overlay-pane path').forEach(path => {
        try {
          path.remove();
        } catch (e) {
          console.error('Error removing path:', e);
        }
      });
      
      if (onClearAll) {
        onClearAll();
      }
    }, 100);
  });
  
  // Initialize configuration and event handlers using custom hooks
  useDrawToolsConfiguration(featureGroup);
  useDrawToolsEventHandlers(getPathElements);
  useSavedPathsRestoration(featureGroup);
  usePathElementsCleaner(clearPathElements);
  
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    clearPathElements
  }));

  // Function to add zoom controls to the draw toolbar
  const addZoomControlsToToolbar = () => {
    if (!editControlRef.current || !featureGroup || !(featureGroup as any)._map || zoomControlsAddedRef.current) return;
    
    const map = (featureGroup as any)._map;
    
    // Wait for the draw toolbar to be available and try multiple selectors
    const checkAndAddControls = () => {
      const drawToolbar = document.querySelector('.leaflet-draw-toolbar') || 
                         document.querySelector('.leaflet-draw-actions') ||
                         document.querySelector('.leaflet-bar');
      
      if (drawToolbar && !zoomControlsAddedRef.current) {
        console.log('Adding zoom controls to draw toolbar');
        
        // Remove existing zoom controls if they exist
        const existingZoomControls = document.querySelector('.custom-zoom-controls');
        if (existingZoomControls) {
          existingZoomControls.remove();
        }
        
        // Create zoom controls container
        const zoomControlsContainer = document.createElement('div');
        zoomControlsContainer.className = 'custom-zoom-controls leaflet-bar';
        zoomControlsContainer.style.cssText = `
          position: absolute;
          top: 0;
          right: -120px;
          z-index: 1000;
          background: white;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
        `;
        
        // Zoom In button
        const zoomInBtn = document.createElement('a');
        zoomInBtn.className = 'leaflet-control-zoom-in';
        zoomInBtn.href = '#';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.innerHTML = '+';
        zoomInBtn.style.cssText = `
          display: block;
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          text-decoration: none;
          color: #333;
          background: #fff;
          border-bottom: 1px solid #ccc;
          font-weight: bold;
          font-size: 18px;
          cursor: pointer;
        `;
        zoomInBtn.onclick = (e) => {
          e.preventDefault();
          map.zoomIn();
          toast.success('Zoomed in');
        };
        
        // Zoom Out button
        const zoomOutBtn = document.createElement('a');
        zoomOutBtn.className = 'leaflet-control-zoom-out';
        zoomOutBtn.href = '#';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.innerHTML = '−';
        zoomOutBtn.style.cssText = `
          display: block;
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          text-decoration: none;
          color: #333;
          background: #fff;
          border-bottom: 1px solid #ccc;
          font-weight: bold;
          font-size: 18px;
          cursor: pointer;
        `;
        zoomOutBtn.onclick = (e) => {
          e.preventDefault();
          map.zoomOut();
          toast.success('Zoomed out');
        };
        
        // Reset View button
        const resetBtn = document.createElement('a');
        resetBtn.className = 'leaflet-control-reset';
        resetBtn.href = '#';
        resetBtn.title = 'Reset View';
        resetBtn.innerHTML = '⌂';
        resetBtn.style.cssText = `
          display: block;
          width: 30px;
          height: 30px;
          line-height: 30px;
          text-align: center;
          text-decoration: none;
          color: #333;
          background: #fff;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
        `;
        resetBtn.onclick = (e) => {
          e.preventDefault();
          map.setView([51.505, -0.09], 13);
          toast.info('View reset');
        };
        
        // Add buttons to container
        zoomControlsContainer.appendChild(zoomInBtn);
        zoomControlsContainer.appendChild(zoomOutBtn);
        zoomControlsContainer.appendChild(resetBtn);
        
        // Add to the draw toolbar container - fix TypeScript error by casting to HTMLElement
        (drawToolbar as HTMLElement).style.position = 'relative';
        drawToolbar.appendChild(zoomControlsContainer);
        
        zoomControlsAddedRef.current = true;
        console.log('Zoom controls added successfully');
      } else {
        // Retry after a short delay if toolbar not found
        setTimeout(checkAndAddControls, 200);
      }
    };
    
    checkAndAddControls();
  };

  // Function to check if there are any layers or SVG paths
  const checkForLayers = () => {
    if (!featureGroup) return false;
    
    // Check for layers in the feature group
    let layersFound = false;
    if (featureGroup.getLayers && featureGroup.getLayers().length > 0) {
      layersFound = true;
    }
    
    // Check for SVG paths in the DOM
    const pathElements = getPathElements();
    const svgPathsFound = pathElements && pathElements.length > 0;
    
    // Check for any drawn elements in the map
    const map = (featureGroup as any)._map;
    let drawnElementsFound = false;
    if (map) {
      const container = map.getContainer();
      if (container) {
        const paths = container.querySelectorAll('.leaflet-overlay-pane path');
        drawnElementsFound = paths.length > 0;
      }
    }
    
    return layersFound || svgPathsFound || drawnElementsFound;
  };

  // Effect to monitor layer changes and update edit control state
  useEffect(() => {
    const updateEditControlState = () => {
      const hasAnyLayers = checkForLayers();
      setHasLayers(hasAnyLayers);
      
      // Force update the edit control to refresh its state
      if (editControlRef.current && editControlRef.current._toolbars) {
        const editToolbar = editControlRef.current._toolbars.edit;
        const removeToolbar = editControlRef.current._toolbars.remove;
        
        if (editToolbar) {
          if (hasAnyLayers) {
            editToolbar.enable();
          } else {
            editToolbar.disable();
          }
        }
        
        if (removeToolbar) {
          if (hasAnyLayers) {
            removeToolbar.enable();
          } else {
            removeToolbar.disable();
          }
        }
      }
      
      // Add zoom controls after toolbar is ready
      setTimeout(addZoomControlsToToolbar, 300);
    };
    
    // Initial check
    updateEditControlState();
    
    // Set up periodic checking for layers
    const interval = setInterval(updateEditControlState, 1000);
    
    // Listen for various events that might change layer state
    const events = ['layeradd', 'layerremove', 'drawingCreated', 'drawingDeleted', 'storage', 'markersUpdated'];
    
    const handleLayerChange = () => {
      setTimeout(updateEditControlState, 100);
    };
    
    // Add event listeners to the map if available
    const map = (featureGroup as any)._map;
    if (map) {
      events.forEach(event => {
        if (event === 'storage' || event === 'markersUpdated' || event === 'drawingCreated' || event === 'drawingDeleted') {
          window.addEventListener(event, handleLayerChange);
        } else {
          map.on(event, handleLayerChange);
        }
      });
    }
    
    return () => {
      clearInterval(interval);
      if (map) {
        events.forEach(event => {
          if (event === 'storage' || event === 'markersUpdated' || event === 'drawingCreated' || event === 'drawingDeleted') {
            window.removeEventListener(event, handleLayerChange);
          } else {
            map.off(event, handleLayerChange);
          }
        });
      }
    };
  }, [featureGroup, getPathElements]);

  // Effect to initialize feature group
  useEffect(() => {
    // Add safety mechanism to prevent errors when feature group is not initialized
    if (featureGroup && !initializedRef.current) {
      // Apply patch to ensure all needed methods exist in a type-safe way
      if (!featureGroup.eachLayer) {
        const eachLayerFn = function(this: L.FeatureGroup, cb: (layer: L.Layer) => void) {
          // Use type assertion to access internal _layers property
          const layers = (this as any)._layers;
          if (layers) {
            Object.keys(layers).forEach(key => {
              cb(layers[key]);
            });
          }
          return this; // Return this for chaining
        };
        
        // Explicitly cast the function to avoid TypeScript errors
        (featureGroup as any).eachLayer = eachLayerFn;
      }
      
      // Store map reference globally to help with cleanup operations
      if ((featureGroup as any)._map) {
        (window as any).leafletMap = (featureGroup as any)._map;
      }
      
      // Mark as initialized
      initializedRef.current = true;
    }
  }, [featureGroup]);

  // Monitor edit control and enhance its clear all functionality
  useEffect(() => {
    if (editControlRef.current) {
      const originalClear = editControlRef.current?._layerGroup?.clearLayers;
      
      if (originalClear && typeof originalClear === 'function') {
        // Enhance the clear layers function to also clear SVG elements
        (editControlRef.current._layerGroup as any).clearLayers = function() {
          // Call original function
          originalClear.apply(this);
          
          // Then do manual DOM cleanup
          if ((this as any)._map) {
            clearAllMapSvgElements((this as any)._map);
            
            // Manual cleanup
            document.querySelectorAll('.leaflet-overlay-pane path').forEach(path => {
              try {
                path.remove();
              } catch (e) {
                console.error('Error removing path:', e);
              }
            });
          }
        };
      }
    }
  }, [editControlRef.current]);

  // Get draw options from configuration
  const drawOptions = getDrawOptions();
  
  // Configure edit options with proper layer detection
  const editOptions = {
    featureGroup,
    edit: {
      // Enable editing for all supported shapes
      selectedPathOptions: { 
        maintainColor: true,
        opacity: 0.7,
        weight: 4
      },
      moveMarkers: true,
      // Force enable editing regardless of layer count
      enable: true
    },
    remove: {
      // Force enable removing regardless of layer count
      enable: true
    }
  };

  return (
    <>
      <EditControl
        ref={editControlRef}
        position="topright"
        onCreated={handleCreated}
        draw={drawOptions}
        edit={editOptions}
        featureGroup={featureGroup}
      />
      
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and shapes? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
