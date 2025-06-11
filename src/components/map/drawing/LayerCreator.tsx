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
      const coords = drawing.coordinates as any;
      if (Array.isArray(coords) && coords.length >= 2) {
        const [center, radius] = coords;
        layer = L.circle(center as L.LatLngExpression, { radius: radius as number });
      }
    } else if (drawing.type === 'marker') {
      const coords = drawing.coordinates as any;
      if (Array.isArray(coords) && coords.length >= 2) {
        layer = L.marker([coords[0], coords[1]] as L.LatLngExpression);
      }
    }

    if (!layer) {
      console.error(`Could not create layer for drawing type: ${drawing.type}`);
      return;
    }

    // Set up the layer with proper identification
    (layer as any).options = {
      ...(layer as any).options,
      id: drawing.id,
      isDrawn: true,
      drawingId: drawing.id // Add this for easier identification
    };

    // Add custom click handling for the layer - prioritize upload request
    layer.on('click', (e: L.LeafletMouseEvent) => {
      console.log(`Layer clicked for drawing: ${drawing.id} - triggering upload request`);
      
      // Stop event propagation to prevent map click
      L.DomEvent.stopPropagation(e);
      
      // Trigger upload request FIRST - this is the primary action
      if (onUploadRequest) {
        console.log(`Calling onUploadRequest for drawing: ${drawing.id}`);
        onUploadRequest(drawing.id);
      }
      
      // Then call region click as secondary action
      if (onRegionClick) {
        console.log(`Calling onRegionClick for drawing: ${drawing.id}`);
        onRegionClick(drawing);
      }
    });

    // Add the layer to the feature group
    featureGroup.addLayer(layer);
    layersRef.set(drawing.id, layer);

    // Set up the SVG path attributes after the layer is added - use multiple attempts
    const setupSvgPath = () => {
      setTimeout(() => {
        if (!isMounted) return;
        
        console.log(`Setting up SVG path for drawing: ${drawing.id}`);
        
        // Multiple strategies to find the SVG path element
        let pathElement: SVGPathElement | null = null;
        
        // Strategy 1: Find by existing data-drawing-id
        pathElement = document.querySelector(`path[data-drawing-id="${drawing.id}"]`) as SVGPathElement;
        
        // Strategy 2: Find by data-shape-type and match coordinates or other attributes
        if (!pathElement) {
          const shapePaths = document.querySelectorAll(`path[data-shape-type="${drawing.type}"]`);
          console.log(`Found ${shapePaths.length} paths with shape type ${drawing.type}`);
          
          // For now, take the last added path of this type (most recently created)
          if (shapePaths.length > 0) {
            pathElement = shapePaths[shapePaths.length - 1] as SVGPathElement;
            console.log(`Selected path element based on shape type: ${drawing.type}`);
          }
        }
        
        // Strategy 3: Find the most recent path without data-drawing-id
        if (!pathElement) {
          const allPaths = document.querySelectorAll('path.leaflet-interactive:not([data-drawing-id])');
          if (allPaths.length > 0) {
            pathElement = allPaths[allPaths.length - 1] as SVGPathElement;
            console.log(`Selected most recent path without drawing ID`);
          }
        }
        
        if (pathElement) {
          console.log(`Found path element for drawing ${drawing.id}, setting up attributes and click handler`);
          
          // Set the crucial data-drawing-id attribute
          pathElement.setAttribute('data-drawing-id', drawing.id);
          pathElement.setAttribute('data-user-id', drawing.userId || 'unknown');
          pathElement.style.cursor = 'pointer';
          pathElement.style.pointerEvents = 'all';
          
          // Remove any existing click listeners to avoid duplicates
          const existingHandler = (pathElement as any).__drawingClickHandler;
          if (existingHandler) {
            pathElement.removeEventListener('click', existingHandler);
          }
          
          // Create new click handler that triggers upload request immediately
          const clickHandler = (e: MouseEvent) => {
            console.log(`SVG Path clicked for drawing: ${drawing.id} - calling upload request`);
            e.stopPropagation();
            e.preventDefault();
            
            // Call upload request IMMEDIATELY - this should show the upload popup
            if (onUploadRequest) {
              console.log(`Triggering upload request from SVG path click for drawing: ${drawing.id}`);
              onUploadRequest(drawing.id);
            } else {
              console.error(`No onUploadRequest handler available for drawing: ${drawing.id}`);
            }
            
            // Secondary action: region click
            if (onRegionClick) {
              console.log(`Calling onRegionClick from SVG path for drawing: ${drawing.id}`);
              onRegionClick(drawing);
            }
          };
          
          // Store reference to handler for cleanup
          (pathElement as any).__drawingClickHandler = clickHandler;
          
          // Add the click event listener with high priority
          pathElement.addEventListener('click', clickHandler, { 
            passive: false, 
            capture: true // Use capture to handle event before it bubbles
          });
          
          console.log(`SVG path click handler successfully set up for drawing ${drawing.id}`);
          console.log(`Path element attributes:`, {
            'data-drawing-id': pathElement.getAttribute('data-drawing-id'),
            'data-shape-type': pathElement.getAttribute('data-shape-type'),
            cursor: pathElement.style.cursor,
            pointerEvents: pathElement.style.pointerEvents
          });
          
          // Apply floor plan if exists
          const loadFloorPlan = async () => {
            const floorPlan = await getFloorPlanById(drawing.id);
            if (floorPlan && pathElement) {
              console.log(`Applying existing floor plan for drawing: ${drawing.id}`);
              applyImageClipMask(pathElement, floorPlan.data, drawing.id);
            }
          };
          loadFloorPlan();
        } else {
          console.error(`Could not find SVG path element for drawing: ${drawing.id}`);
          // Retry after a longer delay
          if (isMounted) {
            setTimeout(setupSvgPath, 500);
          }
        }
      }, 200);
    };
    
    // Start the SVG path setup
    setupSvgPath();

    // Add buttons for edit mode
    if (activeTool === 'edit') {
      setTimeout(() => {
        if (!isMounted) return;
        addEditModeButtons();
      }, 300);
    }

    function addEditModeButtons() {
      if (!layer || !isMounted) return;

      try {
        const bounds = (layer as any).getBounds();
        if (!bounds) return;

        // Access map through the feature group's internal structure
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
