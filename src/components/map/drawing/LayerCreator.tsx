
import React from 'react';
import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import { DrawingData } from '@/utils/drawing-utils';
import RemoveButton from './RemoveButton';
import UploadButton from './UploadButton';
import ImageControls from './ImageControls';
import { getFloorPlanById } from '@/utils/floor-plan-utils';
import { applyImageClipMask } from '@/utils/svg-clip-mask';

interface CreateLayerFromDrawingProps {
  drawing: DrawingData;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  isMounted: boolean;
  layersRef: Map<string, L.Layer>;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  imageControlRoots: Map<string, any>;
  onRegionClick?: (drawing: DrawingData) => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadRequest?: (drawingId: string) => void;
}

export function createLayerFromDrawing({
  drawing,
  featureGroup,
  activeTool,
  isMounted,
  layersRef,
  removeButtonRoots,
  uploadButtonRoots,
  imageControlRoots,
  onRegionClick,
  onRemoveShape,
  onUploadRequest
}: CreateLayerFromDrawingProps) {
  if (!isMounted) return;

  try {
    console.log(`Creating layer for drawing: ${drawing.id}, type: ${drawing.type}`);
    
    let layer: L.Layer | null = null;

    // Create the appropriate layer based on drawing type
    if (drawing.type === 'polygon') {
      layer = L.polygon(drawing.coordinates as L.LatLngExpression[]);
    } else if (drawing.type === 'rectangle') {
      layer = L.rectangle(drawing.coordinates as L.LatLngBoundsExpression);
    } else if (drawing.type === 'circle') {
      // Fix: Handle circle coordinates properly - circle has center and radius
      const coords = drawing.coordinates as any;
      if (Array.isArray(coords) && coords.length >= 2) {
        // For circle, coordinates should be [center, radius] where center is [lat, lng]
        const [center, radius] = coords;
        layer = L.circle(center as L.LatLngExpression, { radius: radius as number });
      }
    } else if (drawing.type === 'polyline') {
      layer = L.polyline(drawing.coordinates as L.LatLngExpression[]);
    }

    if (!layer) {
      console.error(`Could not create layer for drawing type: ${drawing.type}`);
      return;
    }

    // Set up the layer with proper identification
    (layer as any).options = {
      ...(layer as any).options,
      id: drawing.id,
      isDrawn: true
    };

    // Add custom click handling for the layer
    layer.on('click', (e: L.LeafletMouseEvent) => {
      console.log(`Layer clicked for drawing: ${drawing.id}`);
      
      // Stop event propagation to prevent map click
      L.DomEvent.stopPropagation(e);
      
      if (onRegionClick) {
        console.log(`Calling onRegionClick for drawing: ${drawing.id}`);
        onRegionClick(drawing);
      }
      
      if (onUploadRequest) {
        console.log(`Calling onUploadRequest for drawing: ${drawing.id}`);
        onUploadRequest(drawing.id);
      }
    });

    // Add the layer to the feature group
    featureGroup.addLayer(layer);
    layersRef.set(drawing.id, layer);

    // Set up the SVG path attributes after the layer is added
    setTimeout(() => {
      if (!isMounted) return;
      
      const pathElement = document.querySelector(`path[data-drawing-id="${drawing.id}"]`) as SVGPathElement;
      if (!pathElement) {
        // Try to find by other attributes
        const allPaths = document.querySelectorAll('path');
        let foundPath: SVGPathElement | null = null;
        
        allPaths.forEach(path => {
          const pathData = path.getAttribute('d');
          if (pathData && drawing.svgPath && pathData.includes(drawing.svgPath.split(' ')[0])) {
            foundPath = path as SVGPathElement;
          }
        });
        
        if (foundPath) {
          console.log(`Found path element for drawing ${drawing.id} by SVG data matching`);
          foundPath.setAttribute('data-drawing-id', drawing.id);
          foundPath.style.cursor = 'pointer';
          
          // Add click event to the SVG path
          foundPath.addEventListener('click', (e: MouseEvent) => {
            console.log(`SVG Path clicked for drawing: ${drawing.id}`);
            e.stopPropagation();
            
            if (onRegionClick) {
              console.log(`Calling onRegionClick from SVG path for drawing: ${drawing.id}`);
              onRegionClick(drawing);
            }
            
            if (onUploadRequest) {
              console.log(`Calling onUploadRequest from SVG path for drawing: ${drawing.id}`);
              onUploadRequest(drawing.id);
            }
          });
        } else {
          console.warn(`Could not find path element for drawing: ${drawing.id}`);
        }
      } else {
        console.log(`Found path element for drawing ${drawing.id}`);
        pathElement.style.cursor = 'pointer';
        
        // Add click event to the SVG path
        pathElement.addEventListener('click', (e: MouseEvent) => {
          console.log(`SVG Path clicked for drawing: ${drawing.id}`);
          e.stopPropagation();
          
          if (onRegionClick) {
            console.log(`Calling onRegionClick from SVG path for drawing: ${drawing.id}`);
            onRegionClick(drawing);
          }
          
          if (onUploadRequest) {
            console.log(`Calling onUploadRequest from SVG path for drawing: ${drawing.id}`);
            onUploadRequest(drawing.id);
          }
        });
      }

      // Apply floor plan if exists
      const loadFloorPlan = async () => {
        const floorPlan = await getFloorPlanById(drawing.id);
        if (floorPlan && pathElement) {
          console.log(`Applying existing floor plan for drawing: ${drawing.id}`);
          applyImageClipMask(pathElement, floorPlan.data, drawing.id);
        }
      };
      loadFloorPlan();
    }, 100);

    // Add buttons for edit mode
    if (activeTool === 'edit') {
      setTimeout(() => {
        if (!isMounted) return;
        addEditModeButtons();
      }, 200);
    }

    function addEditModeButtons() {
      if (!layer || !isMounted) return;

      try {
        const bounds = (layer as any).getBounds();
        if (!bounds) return;

        // Fix: Access map through the feature group's internal structure
        const map = (featureGroup as any)._map;
        if (!map) return;

        const center = bounds.getCenter();
        const point = map.latLngToContainerPoint(center);

        // Remove button
        const removeButtonContainer = document.createElement('div');
        removeButtonContainer.style.position = 'absolute';
        removeButtonContainer.style.left = `${point.x - 20}px`;
        removeButtonContainer.style.top = `${point.y - 30}px`;
        removeButtonContainer.style.zIndex = '1000';
        removeButtonContainer.style.pointerEvents = 'auto';

        const mapContainer = map.getContainer();
        mapContainer.appendChild(removeButtonContainer);

        const removeRoot = createRoot(removeButtonContainer);
        removeRoot.render(
          <RemoveButton 
            onClick={() => onRemoveShape && onRemoveShape(drawing.id)} 
          />
        );
        removeButtonRoots.set(`${drawing.id}-remove`, removeRoot);

        // Upload button
        const uploadButtonContainer = document.createElement('div');
        uploadButtonContainer.style.position = 'absolute';
        uploadButtonContainer.style.left = `${point.x + 20}px`;
        uploadButtonContainer.style.top = `${point.y - 30}px`;
        uploadButtonContainer.style.zIndex = '1000';
        uploadButtonContainer.style.pointerEvents = 'auto';

        mapContainer.appendChild(uploadButtonContainer);

        const uploadRoot = createRoot(uploadButtonContainer);
        uploadRoot.render(
          <UploadButton 
            onClick={() => {
              console.log(`Upload button clicked for drawing: ${drawing.id}`);
              onUploadRequest && onUploadRequest(drawing.id);
            }} 
          />
        );
        uploadButtonRoots.set(`${drawing.id}-upload`, uploadRoot);

        // Image controls if floor plan exists
        const checkFloorPlan = async () => {
          const floorPlan = await getFloorPlanById(drawing.id);
          if (floorPlan) {
            const imageControlsContainer = document.createElement('div');
            imageControlsContainer.style.position = 'absolute';
            imageControlsContainer.style.left = `${point.x}px`;
            imageControlsContainer.style.top = `${point.y + 20}px`;
            imageControlsContainer.style.zIndex = '1000';
            imageControlsContainer.style.pointerEvents = 'auto';

            mapContainer.appendChild(imageControlsContainer);

            const imageControlsRoot = createRoot(imageControlsContainer);
            imageControlsRoot.render(
              <ImageControls drawingId={drawing.id} />
            );
            imageControlRoots.set(`${drawing.id}-controls`, imageControlsRoot);
          }
        };
        checkFloorPlan();
      } catch (error) {
        console.error('Error adding edit mode buttons:', error);
      }
    }

    console.log(`Successfully created layer for drawing: ${drawing.id}`);
  } catch (error) {
    console.error(`Error creating layer for drawing ${drawing.id}:`, error);
  }
}
