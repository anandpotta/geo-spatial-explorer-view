
import L from 'leaflet';

/**
 * Force SVG path creation for a layer
 */
export function forceSvgPathCreation(layer: L.Layer): void {
  if (!layer) return;
  
  try {
    // Ensure layer has SVG renderer
    if (layer.options) {
      layer.options.renderer = L.svg();
      
      // Ensure visibility styles are set
      if (layer.options) {
        layer.options.fillOpacity = layer.options.fillOpacity || 0.5;
        layer.options.opacity = layer.options.opacity || 1;
        layer.options.weight = layer.options.weight || 3;
      }
    }
    
    // Force update path if applicable
    if (typeof (layer as any)._updatePath === 'function') {
      try {
        (layer as any)._updatePath();
      } catch (err) {
        console.warn('Error in _updatePath, trying alternative approach:', err);
        
        // Try alternative approach for polygons
        if ((layer as any)._renderer && typeof (layer as any)._renderer._updatePoly === 'function' && (layer as any).getLatLngs) {
          try {
            (layer as any)._renderer._updatePoly(layer, true);
          } catch (innerErr) {
            console.warn('Alternative path update failed:', innerErr);
          }
        }
      }
      
      // Also ensure path is visible after update
      if ((layer as any)._path) {
        (layer as any)._path.style.display = 'block';
        (layer as any)._path.style.visibility = 'visible';
        (layer as any)._path.style.opacity = '1';
        (layer as any)._path.style.fillOpacity = '0.5';
        (layer as any)._path.style.pointerEvents = 'auto';
      }
    }
    
    // For feature groups, apply to each layer
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: any) => {
        if (subLayer.options) {
          subLayer.options.renderer = L.svg();
          subLayer.options.fillOpacity = subLayer.options.fillOpacity || 0.5;
          subLayer.options.opacity = subLayer.options.opacity || 1;
          subLayer.options.weight = subLayer.options.weight || 3;
        }
        
        if (typeof subLayer._updatePath === 'function') {
          try {
            subLayer._updatePath();
          } catch (err) {
            console.warn('Error updating sublayer path:', err);
            // Try alternative approach for polygons
            if (subLayer._renderer && typeof subLayer._renderer._updatePoly === 'function' && subLayer.getLatLngs) {
              try {
                subLayer._renderer._updatePoly(subLayer, true);
              } catch (innerErr) {
                console.warn('Alternative sublayer path update failed:', innerErr);
              }
            }
          }
          
          // Also ensure path is visible after update
          if (subLayer._path) {
            subLayer._path.style.display = 'block';
            subLayer._path.style.visibility = 'visible';
            subLayer._path.style.opacity = '1';
            subLayer._path.style.fillOpacity = '0.5';
            subLayer._path.style.pointerEvents = 'auto';
          }
        }
      });
    }
    
    // If the layer is a circle, ensure it's properly displaying
    if ((layer as any).getRadius && (layer as any)._path) {
      const path = (layer as any)._path;
      path.style.display = 'block';
      path.style.visibility = 'visible';
      path.style.opacity = '1';
      path.style.fillOpacity = '0.5';
      path.style.pointerEvents = 'auto';
    }
  } catch (err) {
    console.error('Error forcing SVG path creation:', err);
  }
}

/**
 * Make a layer visible by ensuring its style attributes are correct
 */
export function ensureLayerVisibility(layer: L.Layer): void {
  try {
    // Direct path access
    if ((layer as any)._path) {
      const path = (layer as any)._path;
      path.style.display = 'block';
      path.style.visibility = 'visible';
      path.style.opacity = '1';
      path.style.fillOpacity = '0.5';
      path.style.pointerEvents = 'auto';
    }
    
    // For feature groups
    if (typeof (layer as any).eachLayer === 'function') {
      (layer as any).eachLayer((subLayer: any) => {
        if (subLayer._path) {
          const path = subLayer._path;
          path.style.display = 'block';
          path.style.visibility = 'visible';
          path.style.opacity = '1';
          path.style.fillOpacity = '0.5';
          path.style.pointerEvents = 'auto';
        }
      });
    }
  } catch (err) {
    console.error('Error ensuring layer visibility:', err);
  }
}
