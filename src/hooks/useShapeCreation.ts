
// Simplified hook for library distribution
export function useShapeCreation(onCreated: (shape: any) => void) {
  const handleCreated = (e: any) => {
    const layer = e.layer;
    const layerType = e.layerType;
    
    if (!layer) {
      console.error('No layer in created event');
      return;
    }
    
    try {
      // Extract GeoJSON for saving
      const geoJSON = layer.toGeoJSON();
      
      // Get the SVG path data if available
      let svgPath = null;
      if (layer._path && layer._path.getAttribute) {
        svgPath = layer._path.getAttribute('d');
      }
      
      // Create base shape object
      const baseShape = {
        layer,
        geoJSON,
        svgPath,
        center: layer.getBounds ? layer.getBounds().getCenter() : null,
        type: layerType,
        id: crypto.randomUUID()
      };
      
      // Only add position for actual marker types, not for circles or other shapes
      if (layerType === 'marker' && layer.getLatLng) {
        const latLng = layer.getLatLng();
        const shape = {
          ...baseShape,
          position: [latLng.lat, latLng.lng] as [number, number]
        };
        
        console.log(`Shape created: ${layerType}`, shape);
        
        // Call the provided callback with the shape
        if (onCreated) {
          onCreated(shape);
        }
      } else {
        // For circles, rectangles, polygons - no position property needed
        console.log(`Shape created: ${layerType}`, baseShape);
        
        // Call the provided callback with the shape (no position for non-marker shapes)
        if (onCreated) {
          onCreated(baseShape);
        }
      }
    } catch (err) {
      console.error('Error creating shape:', err);
    }
  };
  
  return { handleCreated };
}
