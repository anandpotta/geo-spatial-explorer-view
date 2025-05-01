
import L from 'leaflet';
import { toast } from 'sonner';
import { addEditingCapability } from './LayerEditingUtils';
import { ensureLayerVisibility, forceSvgPathCreation } from './svg';
import { Shape } from '@/utils/shape-creation/shape-types';
import { generateSvgPathFromCoordinates } from '@/utils/shape-creation/svg-path-generator';
import { prepareLayerStyle, ensurePathVisibility, addInteractiveClass } from '@/utils/shape-creation/layer-preparation';
import { extractMarkerPosition, extractShapeData } from '@/utils/shape-creation/shape-extraction';

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
    prepareLayerStyle(layer);
    
    // If the layer has a _path property, make sure it's visible
    ensurePathVisibility(layer);
    
    // Force SVG path creation
    forceSvgPathCreation(layer);
    
    // Extract SVG path data if available
    if (layer._path) {
      shape.svgPath = layer._path.getAttribute('d');
      console.log('SVG path extracted:', shape.svgPath);
      
      // Explicitly set visibility styles
      ensurePathVisibility(layer);
    }
    
    // For markers, extract position information
    if (layerType === 'marker') {
      shape.position = extractMarkerPosition(layer);
    }
    // For polygons, rectangles, and circles
    else {
      const shapeData = extractShapeData(layerType, layer);
      shape = { ...shape, ...shapeData };
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
      addInteractiveClass(layer);
      
      onCreated(shape);
    }, 200); // Increased timeout to ensure rendering completes
  } catch (err) {
    console.error('Error handling created shape:', err);
    toast.error('Error creating shape');
  }
}
