
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
  } else {
    // Ensure existing handlers have the required methods
    if (layer.editing && !layer.editing.disable) {
      layer.editing.disable = function(this: L.Handler): void {
        console.log("Disable called on layer with incomplete handler");
      };
    }
    
    if (layer.editing && !layer.editing.enable) {
      layer.editing.enable = function(this: L.Handler): void {
        console.log("Enable called on layer with incomplete handler");
      };
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
    edit: {
      featureGroup: featureGroup,
      selectedPathOptions: {
        dashArray: '10, 10',
        fill: true,
        fillColor: '#fe57a1',
        fillOpacity: 0.1,
        maintainColor: false
      }
    },
    remove: true,
    // Merge any additional edit options
    ...(typeof edit === 'object' ? edit : {})
  };
}
