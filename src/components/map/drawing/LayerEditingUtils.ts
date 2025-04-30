
import L from 'leaflet';

/**
 * Adds editing capability to a layer
 */
export function addEditingCapability(layer: L.Path): void {
  if (!layer.editing) {
    try {
      // Create a properly typed handler
      const editHandler = new (L.Handler as any).PolyEdit(layer);
      
      // Add fallback methods with proper typing
      if (!editHandler.disable) {
        editHandler.disable = function(this: L.Handler): void {
          console.log("Disable called on layer without proper handler");
        };
      }
      
      if (!editHandler.enable) {
        editHandler.enable = function(this: L.Handler): void {
          console.log("Enable called on layer without proper handler");
        };
      }
      
      // Assign the properly typed handler
      layer.editing = editHandler;
    } catch (err) {
      console.error('Error adding editing capability to layer:', err);
    }
  }
}

/**
 * Ensure that all layers in a feature group have editing capability
 */
export function initializeLayerEditing(featureGroup: L.FeatureGroup): void {
  try {
    featureGroup.eachLayer((layer: any) => {
      if (layer instanceof L.Path) {
        addEditingCapability(layer);
      }
    });
  } catch (err) {
    console.error('Error initializing layer editing:', err);
  }
}

/**
 * Creates edit options for the EditControl component
 */
export function createEditOptions(featureGroup: L.FeatureGroup, edit?: any): any {
  return {
    featureGroup: featureGroup,
    // Set some sensible defaults for edit handlers
    edit: true,
    remove: true,
    // Ensure we have proper edit handler initialization
    ...(typeof edit === 'object' ? edit : {})
  };
}
