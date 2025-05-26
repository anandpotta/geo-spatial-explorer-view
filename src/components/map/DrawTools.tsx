
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
import { useLayerMonitoring } from '@/hooks/useLayerMonitoring';
import { useFeatureGroupInitialization } from '@/hooks/useFeatureGroupInitialization';
import { ZoomControls } from './drawing/ZoomControls';
import { ClearAllConfirmationDialog } from './drawing/ClearAllConfirmationDialog';

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
  const [zoomControlsAdded, setZoomControlsAdded] = useState(false);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Initialize feature group
  useFeatureGroupInitialization(featureGroup);
  
  // Monitor layers
  const { hasLayers } = useLayerMonitoring(featureGroup, getPathElements, editControlRef);
  
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

  // Get map instance for zoom controls
  const map = (featureGroup as any)._map || null;

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
      
      <ZoomControls 
        map={map}
        isControlsAdded={zoomControlsAdded}
        onControlsAdded={() => setZoomControlsAdded(true)}
      />
      
      <ClearAllConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={confirmClearAll}
      />
    </>
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
