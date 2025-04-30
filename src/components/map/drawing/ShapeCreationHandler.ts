
import L from 'leaflet';
import { toast } from 'sonner';
import { addEditingCapability } from './LayerEditingUtils';
import { ensureLayerVisibility, forceSvgPathCreation } from './PathUtils';

interface Shape {
  type: string;
  layer: L.Layer;
  svgPath?: string;
  position?: [number, number];
  geoJSON?: any;
  coordinates?: [number, number][];
  radius?: number;
}

/**
 * Handles shape creation events from Leaflet Draw
 */
export function handleShapeCreated(e: any, onCreated: (shape: any) => void): void {
  try {
    const { layerType, layer } = e;
    
    if (!layer) {
      console.error('No layer created');
      return;
    }
    
    // Ensure the layer has editing capability
    if (layer instanceof L.Path && !layer.editing) {
      addEditingCapability(layer);
    }
    
    // Create a properly structured shape object
    let shape: Shape = { type: layerType, layer };
    
    // Force rendering as SVG path
    if (layer.options) {
      layer.options.renderer = L.svg();
      layer.options.fillOpacity = 0.5; // Ensure fill opacity is set
      layer.options.opacity = 1; // Ensure stroke opacity is set
      layer.options.weight = 3; // Ensure stroke width is visible
      layer.options.color = '#3388ff'; // Ensure color is set
      // Ensure interactive is set
      layer.options.interactive = true;
    }
    
    // If the layer has a _path property, make sure it's visible
    if (layer._path) {
      layer._path.style.visibility = 'visible';
      layer._path.style.display = 'block';
      layer._path.style.opacity = '1';
      layer._path.style.fillOpacity = '0.5';
      layer._path.style.pointerEvents = 'auto';
    }
    
    // Force SVG path creation
    forceSvgPathCreation(layer);
    
    // Extract SVG path data if available
    if (layer._path) {
      shape.svgPath = layer._path.getAttribute('d');
      console.log('SVG path extracted:', shape.svgPath);
      
      // Explicitly set visibility styles
      layer._path.style.display = 'block';
      layer._path.style.visibility = 'visible';
      layer._path.style.opacity = '1';
      layer._path.style.fillOpacity = '0.5';
      layer._path.style.pointerEvents = 'auto';
    }
    
    // For markers, extract position information
    if (layerType === 'marker' && layer.getLatLng) {
      const position = layer.getLatLng();
      shape.position = [position.lat, position.lng];
    }
    
    // For polygons, rectangles, and circles
    else if (['polygon', 'rectangle', 'circle'].includes(layerType)) {
      // Convert to GeoJSON to have a consistent format
      shape.geoJSON = layer.toGeoJSON();
      
      // Extract coordinates based on shape type
      if (layerType === 'polygon' || layerType === 'rectangle') {
        const latLngs = layer.getLatLngs();
        if (Array.isArray(latLngs) && latLngs.length > 0) {
          // Handle potentially nested arrays (multi-polygons)
          const firstRing = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
          shape.coordinates = firstRing.map((ll: L.LatLng) => [ll.lat, ll.lng]);
        }
      } else if (layerType === 'circle') {
        const center = layer.getLatLng();
        shape.coordinates = [[center.lat, center.lng]];
        shape.radius = layer.getRadius();
      }
    }
    
    // Wait for the next tick to ensure DOM is updated
    setTimeout(() => {
      // Try to get SVG path data after layer is rendered
      if (!shape.svgPath && layer._path) {
        shape.svgPath = layer._path.getAttribute('d');
        console.log('SVG path extracted after timeout:', shape.svgPath);
      }
      
      // If still no SVG path for polygon/rectangle, try to generate it
      if (!shape.svgPath && (layerType === 'polygon' || layerType === 'rectangle') && shape.coordinates) {
        console.log('Attempting to generate SVG path from coordinates');
        // This is a fallback approach to create an SVG path from coordinates
        const svgPath = generateSvgPathFromCoordinates(shape.coordinates, layer);
        if (svgPath) {
          shape.svgPath = svgPath;
          console.log('Generated SVG path:', svgPath);
        }
      }
      
      // Final check to ensure layer visibility
      ensureLayerVisibility(layer);
      
      // Force path creation one more time
      forceSvgPathCreation(layer);
      
      // Add an SVG class to the path if it exists
      if (layer._path) {
        layer._path.classList.add('leaflet-interactive');
      }
      
      onCreated(shape);
    }, 200); // Increased timeout to ensure rendering completes
  } catch (err) {
    console.error('Error handling created shape:', err);
    toast.error('Error creating shape');
  }
}

/**
 * Generates an SVG path string from coordinates as a fallback
 */
function generateSvgPathFromCoordinates(coordinates: [number, number][], layer: L.Layer): string | null {
  if (!coordinates || coordinates.length < 3) return null;
  
  try {
    // Get the map and its bounds for projection
    const map = (layer as any)._map;
    if (!map) return null;
    
    // Convert geographic coordinates to pixel coordinates
    const pixelPoints = coordinates.map(coord => {
      const point = map.latLngToLayerPoint(L.latLng(coord[0], coord[1]));
      return [point.x, point.y];
    });
    
    // Create the SVG path string
    let pathString = `M ${pixelPoints[0][0]},${pixelPoints[0][1]}`;
    for (let i = 1; i < pixelPoints.length; i++) {
      pathString += ` L ${pixelPoints[i][0]},${pixelPoints[i][1]}`;
    }
    pathString += ' Z'; // Close the path
    
    return pathString;
  } catch (err) {
    console.error('Error generating SVG path from coordinates:', err);
    return null;
  }
}
