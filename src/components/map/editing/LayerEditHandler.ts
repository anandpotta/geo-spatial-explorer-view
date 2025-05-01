
import L from 'leaflet';

/**
 * Creates or initializes edit handlers for layers
 */
export function createEditHandler(layer: L.Path): L.Handler & { 
  enable?: () => void; 
  disable?: () => void;
} {
  try {
    let editHandler;
      
    // Try to match the appropriate handler based on layer type
    if (L.Edit && L.Edit.Poly && layer instanceof L.Polyline) {
      // For polygons and polylines
      editHandler = new L.Edit.Poly(layer as any);
    } else if (L.Edit && L.Edit.Rectangle && layer instanceof L.Rectangle) {
      // For rectangles
      editHandler = new L.Edit.Rectangle(layer as any);
    } else if (L.Edit && L.Edit.Circle && layer instanceof L.Circle) {
      // For circles
      editHandler = new L.Edit.Circle(layer as any);
    } else if (L.Edit && L.Edit.SimpleShape) {
      // Fallback for other shapes
      editHandler = new L.Edit.SimpleShape(layer as any);
    } else {
      // Last resort fallback
      editHandler = new (L.Handler as any).PolyEdit(layer);
    }
    
    return editHandler;
  } catch (err) {
    console.error("Error creating edit handler:", err);
    // Create a basic object with required methods as fallback
    return {
      enable: function() { console.log("Fallback enable called"); },
      disable: function() { console.log("Fallback disable called"); }
    };
  }
}

/**
 * Ensures a layer's editing object has required methods
 */
export function ensureEditMethods(layer: L.Layer): void {
  if (!layer || !layer.editing) return;
  
  // Ensure the editing handler has all required methods
  if (!layer.editing.disable) {
    layer.editing.disable = function(): void {
      console.log("Disable called on layer with incomplete handler");
    };
  }
  
  if (!layer.editing.enable) {
    layer.editing.enable = function(): void {
      console.log("Enable called on layer with incomplete handler");
    };
  }
}

/**
 * Initialize editing capabilities for all layers in a feature group
 */
export function initializeFeatureGroupEditing(featureGroup: L.FeatureGroup): void {
  if (!featureGroup) return;
  
  try {
    // Ensure each layer has the necessary edit properties
    featureGroup.eachLayer((layer: L.Layer) => {
      if (layer && !layer.editing) {
        // Initialize editing capability if not present
        if (layer instanceof L.Path) {
          // Create a properly typed handler
          layer.editing = createEditHandler(layer);
        }
      } else if (layer && layer.editing) {
        // Ensure existing handlers have required methods
        ensureEditMethods(layer);
      }
    });
  } catch (err) {
    console.error("Error initializing feature group editing:", err);
  }
}
