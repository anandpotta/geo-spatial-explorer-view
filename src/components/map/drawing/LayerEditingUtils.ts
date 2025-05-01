
import L from 'leaflet';

/**
 * Adds editing capability to a layer
 */
export function addEditingCapability(layer: L.Path): void {
  if (!layer.editing) {
    try {
      // Try to use the appropriate edit handler based on layer type
      let editHandler;
      
      if (L.Edit && L.Edit.Poly && layer instanceof L.Polyline) {
        // For polygons and polylines
        editHandler = new L.Edit.Poly(layer as any);
      } else if (L.Edit && L.Edit.Rectangle && layer instanceof L.Rectangle) {
        // For rectangles
        editHandler = new L.Edit.Rectangle(layer as any);
      } else if (L.Edit && L.Edit.Circle && layer instanceof L.Circle) {
        // For circles
        editHandler = new L.Edit.Circle(layer as any);
      } else {
        // Fallback to generic handler
        editHandler = new (L.Handler as any).PolyEdit(layer);
      }
      
      // Add fallback methods with proper typing
      if (editHandler && !editHandler.disable) {
        editHandler.disable = function(): void {
          console.log("Disable called on layer without proper handler");
        };
      }
      
      if (editHandler && !editHandler.enable) {
        editHandler.enable = function(): void {
          console.log("Enable called on layer without proper handler");
        };
      }
      
      // Assign the handler
      layer.editing = editHandler;
    } catch (err) {
      console.error('Error adding editing capability to layer:', err);
      
      // Create a fallback object with required methods
      layer.editing = {
        enable: function() { console.log("Fallback enable called"); },
        disable: function() { console.log("Fallback disable called"); }
      } as any;
    }
  } else {
    // Ensure existing handlers have the required methods
    if (layer.editing && !layer.editing.disable) {
      // Use a type assertion to ensure compatibility
      layer.editing.disable = function(): void {
        console.log("Disable called on layer with incomplete handler");
      } as any;
    }
    
    if (layer.editing && !layer.editing.enable) {
      // Use a type assertion to ensure compatibility
      layer.editing.enable = function(): void {
        console.log("Enable called on layer with incomplete handler");
      } as any;
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
      } else if (layer) {
        // If it's not a Path but still needs editing capability
        if (!layer.editing) {
          layer.editing = {
            enable: function() { console.log("Fallback enable called for non-Path layer"); },
            disable: function() { console.log("Fallback disable called for non-Path layer"); }
          };
        } else if (layer.editing) {
          // Ensure methods exist
          if (typeof layer.editing.enable !== 'function') {
            layer.editing.enable = function() { 
              console.log("Fallback enable added to existing editing object");
            };
          }
          if (typeof layer.editing.disable !== 'function') {
            layer.editing.disable = function() {
              console.log("Fallback disable added to existing editing object");
            };
          }
        }
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
