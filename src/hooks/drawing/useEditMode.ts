
import { useRef } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';
import { useMapValidation } from './useMapValidation';
import { createEditHandler } from '@/components/map/editing/LayerEditHandler';

export function useEditMode() {
  const { checkMapValidity } = useMapValidation();

  const activateEditMode = (
    featureGroupRef: React.RefObject<L.FeatureGroup>,
    drawToolsRef: React.RefObject<any>
  ) => {
    if (!featureGroupRef.current || !checkMapValidity(featureGroupRef.current)) return;
    
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
        
        // First, ensure all layers have editing capabilities and proper SVG paths
        featureGroupRef.current.eachLayer((layer: any) => {
          if (layer && !layer.editing) {
            // Initialize editing capability if missing
            if (layer instanceof L.Path) {
              try {
                // Create the appropriate edit handler
                layer.editing = createEditHandler(layer);
              } catch (err) {
                console.error("Error creating edit handler:", err);
                // Create a fallback handler with required methods
                layer.editing = {
                  enable: function() { console.log("Fallback enable called"); },
                  disable: function() { console.log("Fallback disable called"); }
                };
              }
              
              // Ensure layer uses SVG renderer
              if (layer.options) {
                layer.options.renderer = L.svg();
              }
            }
          }
          
          // Ensure editing handlers have required methods
          if (layer && layer.editing) {
            if (typeof layer.editing.enable !== 'function') {
              layer.editing.enable = function() {
                console.log("Fallback enable called on layer");
              };
            }
            if (typeof layer.editing.disable !== 'function') {
              layer.editing.disable = function() {
                console.log("Fallback disable called on layer");
              };
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
                  
                  // Double-check that layer.editing.enable exists
                  if (layer.editing && typeof layer.editing.enable !== 'function') {
                    layer.editing.enable = function() {
                      console.log("Fallback enable called during edit mode activation");
                    };
                  }
                }
              });
              
              try {
                // Enable the edit mode
                editHandler.enable();
                console.log("Edit mode activated successfully");
              } catch (err) {
                console.error("Error enabling edit handler:", err);
                toast.error("Error activating edit mode");
              }
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

  return { activateEditMode };
}
