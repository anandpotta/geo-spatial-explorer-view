
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./editing/EditControl";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { initializeLayerEditing, createEditOptions } from './drawing/LayerEditingUtils';
import { setupSvgPathRendering, getPathElements, getSVGPathData, forceSvgPathCreation } from './drawing/PathUtils';
import { handleShapeCreated } from './drawing/ShapeCreationHandler';
import { applyPolygonDrawPatches } from '@/utils/leaflet-patches/polygon-draw-patch';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Apply patch for the type reference error
  useEffect(() => {
    // Apply polygon drawing patches
    applyPolygonDrawPatches();
  }, []);
  
  // Setup SVG rendering for all shapes
  useEffect(() => {
    // Initialize editing for existing layers
    if (featureGroup) {
      initializeLayerEditing(featureGroup);
      
      // Apply SVG renderer to all existing layers
      featureGroup.eachLayer((layer: L.Layer) => {
        forceSvgPathCreation(layer);
      });
    }
    
    // Override Leaflet's circle and rectangle rendering to force SVG path creation
    const cleanup = setupSvgPathRendering();
    
    // Periodically check for and force SVG path creation on layers
    const intervalId = setInterval(() => {
      if (featureGroup) {
        featureGroup.eachLayer((layer: L.Layer) => {
          forceSvgPathCreation(layer);
        });
      }
    }, 1000);
    
    // Add an event listener to ensure SVG elements are created when the map is first loaded
    const map = (featureGroup as any)._map;
    if (map) {
      map.on('load moveend zoomend', () => {
        setTimeout(() => {
          if (featureGroup) {
            featureGroup.eachLayer((layer: L.Layer) => {
              forceSvgPathCreation(layer);
            });
          }
        }, 100);
      });
    }
    
    return () => {
      cleanup();
      clearInterval(intervalId);
      if (map) {
        map.off('load moveend zoomend');
      }
    };
  }, [featureGroup]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements: () => getPathElements(featureGroup),
    getSVGPathData: () => {
      // Force SVG path creation before getting path data
      if (featureGroup) {
        featureGroup.eachLayer((layer: L.Layer) => {
          forceSvgPathCreation(layer);
        });
      }
      
      return getSVGPathData(featureGroup);
    }
  }));

  // Create edit options for the control with proper structure
  const editOptions = createEditOptions(featureGroup);
  
  // Custom handler for created shapes
  const handleCreated = (e: any) => {
    console.log('Shape created:', e.layerType);
    handleShapeCreated(e, (shape) => {
      console.log('Shape processed with SVG path:', shape.svgPath);
      onCreated(shape);
    });
  };

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={handleCreated}
      draw={{
        rectangle: {
          shapeOptions: {
            renderer: L.svg(),
            fillOpacity: 0.5,
            color: '#3388ff',
            weight: 3
          }
        },
        polygon: {
          shapeOptions: {
            renderer: L.svg(),
            fillOpacity: 0.5,
            color: '#3388ff',
            weight: 3,
            showArea: true
          },
          // Ensure markers are visible for polygon drawing
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Cannot draw intersecting lines!'
          },
          guidelineDistance: 20,
          showLength: true,
          metric: true,
          zIndexOffset: 2000 // Make sure markers are on top
        },
        circle: {
          shapeOptions: {
            renderer: L.svg(),
            fillOpacity: 0.5,
            color: '#3388ff',
            weight: 3
          }
        },
        circlemarker: false,
        marker: true,
        polyline: false
      }}
      edit={editOptions}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
