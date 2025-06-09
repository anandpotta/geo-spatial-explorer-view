
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
  const [isInitialized, setIsInitialized] = useState(false);
  
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
  useSavedPathsRestoration(editControlRef, isInitialized);
  usePathElementsCleaner(clearPathElements);
  
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    clearPathElements
  }));

  // Enhanced function to check if there are any layers, markers, or SVG paths
  const checkForContent = () => {
    if (!featureGroup) return false;
    
    let contentFound = false;
    
    // Check for layers in the feature group
    if (featureGroup.getLayers && featureGroup.getLayers().length > 0) {
      console.log('Found layers in feature group:', featureGroup.getLayers().length);
      contentFound = true;
    }
    
    // Check for SVG paths in the DOM
    const pathElements = getPathElements();
    if (pathElements && pathElements.length > 0) {
      console.log('Found SVG path elements:', pathElements.length);
      contentFound = true;
    }
    
    // Check for any drawn elements in the map
    const map = (featureGroup as any)._map;
    if (map) {
      const container = map.getContainer();
      if (container) {
        const paths = container.querySelectorAll('.leaflet-overlay-pane path');
        if (paths.length > 0) {
          console.log('Found overlay pane paths:', paths.length);
          contentFound = true;
        }
        
        // Check for markers in the map
        const markers = container.querySelectorAll('.leaflet-marker-icon');
        if (markers.length > 0) {
          console.log('Found markers:', markers.length);
          contentFound = true;
        }
      }
    }
    
    // Check for saved markers in localStorage
    try {
      const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
      if (savedMarkers && savedMarkers.length > 0) {
        console.log('Found saved markers in storage:', savedMarkers.length);
        contentFound = true;
      }
    } catch (e) {
      console.error('Error checking saved markers:', e);
    }
    
    // Check for saved drawings in localStorage
    try {
      const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
      if (savedDrawings && savedDrawings.length > 0) {
        console.log('Found saved drawings in storage:', savedDrawings.length);
        contentFound = true;
      }
    } catch (e) {
      console.error('Error checking saved drawings:', e);
    }
    
    console.log('Content check result:', contentFound);
    return contentFound;
  };

  // More aggressive function to force enable toolbars
  const forceEnableToolbars = () => {
    if (!editControlRef.current || !editControlRef.current._toolbars) return;
    
    const editToolbar = editControlRef.current._toolbars.edit;
    const removeToolbar = editControlRef.current._toolbars.remove;
    
    // Force enable edit toolbar
    if (editToolbar) {
      try {
        // Remove disabled class and enable
        if (editToolbar._button) {
          editToolbar._button.classList.remove('leaflet-disabled');
          editToolbar._button.removeAttribute('disabled');
        }
        
        // Override the _checkDisabled method to always return false
        if (editToolbar._checkDisabled) {
          editToolbar._checkDisabled = () => false;
        }
        
        // Force enable the toolbar
        editToolbar.enable();
        console.log('Edit toolbar forcefully enabled');
      } catch (e) {
        console.error('Error force enabling edit toolbar:', e);
      }
    }
    
    // Force enable remove toolbar
    if (removeToolbar) {
      try {
        // Remove disabled class and enable
        if (removeToolbar._button) {
          removeToolbar._button.classList.remove('leaflet-disabled');
          removeToolbar._button.removeAttribute('disabled');
        }
        
        // Override the _checkDisabled method to always return false
        if (removeToolbar._checkDisabled) {
          removeToolbar._checkDisabled = () => false;
        }
        
        // Force enable the toolbar
        removeToolbar.enable();
        console.log('Remove toolbar forcefully enabled');
      } catch (e) {
        console.error('Error force enabling remove toolbar:', e);
      }
    }
  };

  // Effect to monitor layer changes and force enable edit/remove controls
  useEffect(() => {
    const updateEditControlState = () => {
      const hasContent = checkForContent();
      setHasLayers(hasContent);
      
      if (hasContent) {
        // Force enable toolbars when content is present
        setTimeout(() => {
          forceEnableToolbars();
        }, 100);
      }
    };
    
    // Initial check
    updateEditControlState();
    
    // Set up more frequent checking for content
    const interval = setInterval(updateEditControlState, 500);
    
    // Listen for various events that might change content state
    const events = ['layeradd', 'layerremove', 'drawingCreated', 'drawingDeleted', 'storage', 'markersUpdated'];
    
    const handleContentChange = () => {
      setTimeout(updateEditControlState, 50);
    };
    
    // Add event listeners to the map if available
    const map = (featureGroup as any)._map;
    if (map) {
      events.forEach(event => {
        if (event === 'storage' || event === 'markersUpdated' || event === 'drawingCreated' || event === 'drawingDeleted') {
          window.addEventListener(event, handleContentChange);
        } else {
          map.on(event, handleContentChange);
        }
      });
    }
    
    return () => {
      clearInterval(interval);
      if (map) {
        events.forEach(event => {
          if (event === 'storage' || event === 'markersUpdated' || event === 'drawingCreated' || event === 'drawingDeleted') {
            window.removeEventListener(event, handleContentChange);
          } else {
            map.off(event, handleContentChange);
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
      setIsInitialized(true);
    }
  }, [featureGroup]);

  // Monitor edit control and enhance its functionality
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
      
      // Force enable toolbars after control is ready
      setTimeout(() => {
        forceEnableToolbars();
      }, 1000);
    }
  }, [editControlRef.current]);

  // Get draw options from configuration
  const drawOptions = getDrawOptions();
  
  // Configure edit options to always enable editing and removing
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
      // Force enable editing
      enable: true
    },
    remove: {
      // Force enable removing
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
