
import { toast } from 'sonner';

export function useShapeCreation(onCreated: (shape: any) => void) {
  const handleCreated = (e: any) => {
    const layer = e.layer;
    const layerType = e.layerType;
    
    if (!layer) {
      console.error('No layer in created event');
      return;
    }
    
    try {
      // Generate comprehensive unique identifiers for this shape
      const shapeId = crypto.randomUUID();
      const svgUid = crypto.randomUUID();
      const layerUid = crypto.randomUUID();
      const pathUid = crypto.randomUUID();
      
      // Extract GeoJSON for saving
      const geoJSON = layer.toGeoJSON();
      
      // Get the SVG path data if available and add UIDs
      let svgPath = null;
      if (layer._path && layer._path.getAttribute) {
        svgPath = layer._path.getAttribute('d');
        
        // Add comprehensive unique identifiers to the SVG path element
        layer._path.setAttribute('data-svg-uid', svgUid);
        layer._path.setAttribute('data-shape-id', shapeId);
        layer._path.setAttribute('data-layer-uid', layerUid);
        layer._path.setAttribute('data-path-uid', pathUid);
        layer._path.setAttribute('data-shape-type', layerType);
        layer._path.setAttribute('data-created-timestamp', Date.now().toString());
        
        // Set unique ID and classes
        layer._path.id = `svg-path-${svgUid}`;
        layer._path.classList.add(`shape-${layerType}`);
        layer._path.classList.add(`uid-${svgUid.substring(0, 8)}`);
        layer._path.classList.add(`shape-${shapeId.substring(0, 8)}`);
        
        console.log(`Shape SVG path configured with UIDs: shape=${shapeId}, svg=${svgUid}, layer=${layerUid}, path=${pathUid}`);
      }
      
      // Create base shape object with comprehensive unique identifiers
      const baseShape = {
        layer,
        geoJSON,
        svgPath,
        center: layer.getBounds ? layer.getBounds().getCenter() : null,
        type: layerType,
        id: shapeId,
        uniqueId: shapeId,
        svgUid: svgUid,
        layerUid: layerUid,
        pathUid: pathUid,
        createdAt: new Date().toISOString(),
        uids: {
          shape: shapeId,
          svg: svgUid,
          layer: layerUid,
          path: pathUid
        }
      };
      
      // Only add position for actual marker types, not for circles or other shapes
      if (layerType === 'marker' && layer.getLatLng) {
        const latLng = layer.getLatLng();
        const shape = {
          ...baseShape,
          position: [latLng.lat, latLng.lng] as [number, number]
        };
        
        console.log(`Marker shape created: ${layerType} with comprehensive UIDs:`, shape.uids);
        
        // Call the provided callback with the shape
        if (onCreated) {
          onCreated(shape);
        }
      } else {
        // For circles, rectangles, polygons - no position property needed
        console.log(`Drawing shape created: ${layerType} with comprehensive UIDs:`, baseShape.uids);
        
        // Call the provided callback with the shape (no position for non-marker shapes)
        if (onCreated) {
          onCreated(baseShape);
        }
      }
    } catch (err) {
      console.error('Error creating shape:', err);
      toast.error('Failed to create shape');
    }
  };
  
  return { handleCreated };
}
