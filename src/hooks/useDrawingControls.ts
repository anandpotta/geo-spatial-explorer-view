
import { useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

export interface DrawingControlsRef {
  getFeatureGroup: () => L.FeatureGroup;
  getDrawTools: () => any;
  activateEditMode: () => void;
  openFileUploadDialog: (drawingId: string) => void;
}

export function useDrawingControls() {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawToolsRef = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkMapValidity = () => {
    // Check if the feature group is attached to a valid map
    const featureGroup = featureGroupRef.current;
    try {
      const map = getMapFromLayer(featureGroup);
      if (!map || !(map as any)._loaded) {
        console.warn("Map is not fully loaded, cannot proceed");
        toast.error("Map view is not ready. Please try again in a moment.");
        return false;
      }

      // Check if map container is valid
      if (!map.getContainer() || !document.body.contains(map.getContainer())) {
        console.warn("Map container is not in DOM, cannot proceed");
        toast.error("Map view is not available. Please refresh the page.");
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking map validity:', err);
      toast.error("Could not validate map state. Please refresh the page.");
      return false;
    }
  };

  const activateEditMode = () => {
    if (!checkMapValidity()) return;
    
    if (!featureGroupRef.current || !drawToolsRef.current) {
      console.warn("Feature group or draw tools not available");
      return;
    }

    try {
      console.log("Attempting to activate edit mode");
      const editControl = drawToolsRef.current?.getEditControl();
      
      if (editControl) {
        // Get the map to ensure proper context
        const map = getMapFromLayer(featureGroupRef.current);
        if (!map) {
          console.warn("Map not available for edit mode");
          return;
        }
        
        // First, ensure all layers have editing capabilities
        featureGroupRef.current.eachLayer((layer: any) => {
          if (layer && !layer.editing) {
            // Initialize editing capability if missing
            if (layer instanceof L.Path) {
              layer.editing = new (L.Handler as any).PolyEdit(layer);
            }
          }
        });
        
        // Access the edit toolbar and handler with proper checks
        const toolbar = editControl._toolbars?.edit;
        if (toolbar) {
          // Make sure we have at least one layer to edit
          if (featureGroupRef.current.getLayers().length === 0) {
            console.warn("No layers to edit");
            toast.error("No drawings to edit. Create a drawing first.");
            return;
          }
          
          // Get the edit handler
          const editHandler = toolbar._modes?.edit?.handler;
          if (editHandler) {
            // Check if enable method exists
            if (typeof editHandler.enable === 'function') {
              // Initialize the edit handler with the feature group
              editHandler._featureGroup = featureGroupRef.current;
              
              // Make sure all layers have valid edit properties
              featureGroupRef.current.eachLayer((layer: any) => {
                if (layer) {
                  // Store layer reference on the handler for proper cleanup
                  if (!editHandler._layers) {
                    editHandler._layers = new Map();
                  }
                  
                  if (!editHandler._layers.has(L.Util.stamp(layer))) {
                    editHandler._layers.set(L.Util.stamp(layer), layer);
                  }
                }
              });
              
              // Enable the edit mode
              editHandler.enable();
              console.log("Edit mode activated successfully");
            } else {
              console.warn("Edit handler enable method not found");
              toast.error("Could not enable edit mode");
            }
          } else {
            console.warn("Edit handler not found in toolbar");
          }
        } else {
          console.warn("Edit toolbar not found");
        }
      }
    } catch (err) {
      console.error('Failed to activate edit mode:', err);
      toast.error('Could not enable edit mode');
    }
  };

  const openFileUploadDialog = (drawingId: string) => {
    if (!checkMapValidity()) return;
    
    setSelectedDrawing(drawingId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    selectedDrawing,
    setSelectedDrawing,
    fileInputRef,
    activateEditMode,
    openFileUploadDialog
  };
}
