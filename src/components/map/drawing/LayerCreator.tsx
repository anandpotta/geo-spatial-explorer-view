
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing/types';
import { getDefaultDrawingOptions, createDrawingLayer } from '@/utils/leaflet-drawing-config';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getSavedMarkers } from '@/utils/marker-utils';
import { createLayerControls } from './LayerControls';
import { toast } from 'sonner';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import ImageRotationControls from './ImageRotationControls';
import { createRoot } from './ReactDOMUtils';

interface CreateLayerOptions {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  rotationControlRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
  onRotateImage?: (drawingId: string, degrees: number) => void;
}

export const createLayerFromDrawing = ({
  drawing,
  featureGroup,
  activeTool,
  isMounted,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  rotationControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest,
  onRotateImage
}: CreateLayerOptions) => {
  if (!drawing.geoJSON || !isMounted) return;

  try {
    // Check if the feature group is attached to a valid map
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      console.warn("No valid map attached to feature group, skipping layer creation");
      return;
    }

    const markers = getSavedMarkers();
    const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
    
    const associatedMarker = markers.find(m => m.associatedDrawing === drawing.id);
    const hasFloorPlan = drawingsWithFloorPlans.includes(drawing.id);
    
    const options = getDefaultDrawingOptions(drawing.properties.color);
    if (hasFloorPlan) {
      options.fillColor = '#3b82f6';
      options.fillOpacity = 0.4;
      options.color = '#1d4ed8';
    }
    
    // Special handling for masked images
    if (drawing.maskedImage) {
      // Use the patternOptions in a way TypeScript understands
      (options as any).fillPattern = {
        url: drawing.maskedImage.src,
        pattern: true
      };
      options.fillOpacity = 1;
    }
    
    // Always ensure opacity is set to visible values
    options.opacity = 1;
    options.fillOpacity = options.fillOpacity || 0.2;
    
    // Force SVG renderer for all layers
    options.renderer = L.svg();
    
    const layer = createDrawingLayer(drawing, options);
    
    if (layer) {
      layer.eachLayer((l: L.Layer) => {
        if (l && isMounted) {
          // Store drawing ID on the layer for reference
          (l as any).drawingId = drawing.id;
          
          // Ensure each layer has editing capability
          if (l instanceof L.Path && !(l as any).editing) {
            (l as any).editing = new (L.Handler as any).PolyEdit(l);
          }
          
          // Ensure the layer has necessary properties for edit mode
          if ((l as any)._path) {
            (l as any)._path.setAttribute('data-drawing-id', drawing.id);
            
            // If we have SVG path data but it's not set yet, set it manually
            if (drawing.svgPath && (l as any)._path.getAttribute('d') !== drawing.svgPath) {
              (l as any)._path.setAttribute('d', drawing.svgPath);
            }
            
            // Apply masked image if available
            if (drawing.maskedImage && drawing.maskedImage.src) {
              applyImageToSvgPath((l as any)._path, drawing.maskedImage.src);
            }
          }
          
          // Store the layer reference
          layersRef.set(drawing.id, l);
          
          // Add the remove and upload buttons when in edit mode
          if (onRemoveShape && onUploadRequest) {
            createLayerControls({
              layer: l,
              drawingId: drawing.id,
              activeTool,
              featureGroup,
              removeButtonRoots,
              uploadButtonRoots,
              isMounted,
              onRemoveShape,
              onUploadRequest
            });
          }
          
          // Add rotation controls if there's a masked image
          if (drawing.maskedImage && onRotateImage) {
            addRotationControls({
              layer: l,
              drawingId: drawing.id,
              featureGroup,
              rotationControlRoots,
              isMounted,
              onRotateImage
            });
          }
          
          // Make clicking on any shape trigger the click handler
          if (onRegionClick && isMounted) {
            l.on('click', (e) => {
              // Stop event propagation to prevent map click
              if (e.originalEvent) {
                L.DomEvent.stopPropagation(e.originalEvent);
              }
              
              if (isMounted) {
                onRegionClick(drawing);
              }
            });
          }
        }
      });
      
      if (isMounted) {
        try {
          layer.addTo(featureGroup);
        } catch (err) {
          console.error('Error adding layer to featureGroup:', err);
        }
      }
    }
  } catch (err) {
    console.error('Error adding drawing layer:', err);
  }
};

// Add image pattern to SVG path
const applyImageToSvgPath = (pathElement: SVGPathElement, imageSrc: string) => {
  try {
    // Get the SVG parent
    const svgElement = pathElement.ownerSVGElement;
    if (!svgElement) return;
    
    // Check if a pattern with this ID already exists
    const patternId = `pattern-${Math.random().toString(36).substr(2, 9)}`;
    let pattern = svgElement.querySelector(`#${patternId}`);
    
    if (!pattern) {
      // Create pattern element if it doesn't exist
      const defs = svgElement.querySelector('defs') || 
                  svgElement.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), 
                  svgElement.firstChild);
      
      pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', patternId);
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern.setAttribute('width', '100%');
      pattern.setAttribute('height', '100%');
      
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('href', imageSrc);
      image.setAttribute('width', '100%');
      image.setAttribute('height', '100%');
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      
      pattern.appendChild(image);
      defs.appendChild(pattern);
    }
    
    // Apply pattern to path
    pathElement.setAttribute('fill', `url(#${patternId})`);
    pathElement.setAttribute('stroke-width', '2');
  } catch (err) {
    console.error('Error applying image to SVG path:', err);
  }
};

// Add rotation controls for images
const addRotationControls = ({
  layer,
  drawingId,
  featureGroup,
  rotationControlRoots,
  isMounted,
  onRotateImage
}: {
  layer: L.Layer;
  drawingId: string;
  featureGroup: L.FeatureGroup;
  rotationControlRoots: Map<string, any>;
  isMounted: boolean;
  onRotateImage: (drawingId: string, degrees: number) => void;
}) => {
  if (!isMounted) return;
  
  try {
    // Determine position for controls
    let position;
    
    if ('getLatLng' in layer) {
      // For markers
      position = (layer as L.Marker).getLatLng();
    } else if ('getBounds' in layer) {
      // For polygons, rectangles, etc.
      const bounds = (layer as any).getBounds();
      if (bounds) {
        // Position at the south center
        const southWest = bounds.getSouthWest();
        const southEast = bounds.getSouthEast();
        position = L.latLng(
          southWest.lat,
          southWest.lng + (southEast.lng - southWest.lng) / 2
        );
      }
    } else if ('getLatLngs' in layer) {
      // For polylines or complex shapes
      const latlngs = (layer as any).getLatLngs();
      if (latlngs && latlngs.length > 0) {
        position = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
      }
    }
    
    if (!position) return;
    
    // Create container for rotation controls
    const container = document.createElement('div');
    container.className = 'rotation-controls-wrapper';
    
    // Create marker for rotation controls
    const controlsLayer = L.marker(position, {
      icon: L.divIcon({
        className: 'rotation-controls-container',
        html: container,
        iconSize: [80, 30],
        iconAnchor: [40, -10] // Position above the shape
      }),
      interactive: true,
      zIndexOffset: 1000
    });
    
    try {
      controlsLayer.addTo(featureGroup);
      
      const root = createRoot(container);
      rotationControlRoots.set(drawingId, root);
      
      root.render(
        <ImageRotationControls
          onRotateLeft={() => onRotateImage(drawingId, -90)}
          onRotateRight={() => onRotateImage(drawingId, 90)}
        />
      );
    } catch (err) {
      console.error('Error rendering rotation controls:', err);
    }
  } catch (err) {
    console.error('Error adding rotation controls:', err);
  }
};
