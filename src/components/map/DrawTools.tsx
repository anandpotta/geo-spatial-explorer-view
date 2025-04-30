
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { initializeLayerEditing, createEditOptions } from './drawing/LayerEditingUtils';
import { setupSvgPathRendering, getPathElements, getSVGPathData, forceSvgPathCreation } from './drawing/PathUtils';
import { handleShapeCreated } from './drawing/ShapeCreationHandler';

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
    // Patch Leaflet.Draw to fix the "type is not defined" error
    if (L.Draw && L.Draw.Polygon && L.Draw.Polygon.prototype) {
      // Store the original method
      const originalGetTooltipText = (L.Draw.Polygon.prototype as any)._getTooltipText;
      
      // Override the method to handle the error
      (L.Draw.Polygon.prototype as any)._getTooltipText = function() {
        try {
          // Try to call the original method
          return originalGetTooltipText.apply(this);
        } catch (err) {
          // If we catch the "type is not defined" error, return a fallback object
          console.log("Caught error in tooltip generation, providing fallback");
          return {
            text: this._endLabelText || 'Click first point to close this shape',
            subtext: 'Area will be calculated when complete'
          };
        }
      };

      // Make sure polygon markers are properly styled and visible
      if ((L.Draw.Polygon.prototype as any)._createMarker) {
        const originalCreateMarker = (L.Draw.Polygon.prototype as any)._createMarker;
        
        (L.Draw.Polygon.prototype as any)._createMarker = function(latlng: L.LatLng, index: number) {
          const marker = originalCreateMarker.call(this, latlng, index);
          
          // Ensure the marker icon is visible with proper styling
          if (marker && marker._icon) {
            marker._icon.style.visibility = 'visible';
            marker._icon.style.opacity = '1';
            marker._icon.style.zIndex = '1000';
          }
          
          return marker;
        };
      }
    }

    // Ensure vertex markers are visible with proper styling
    if (L.Draw && L.Draw.Marker && L.Draw.Marker.prototype) {
      const originalOnAdd = (L.Draw.Marker.prototype as any).onAdd;
      
      if (originalOnAdd) {
        (L.Draw.Marker.prototype as any).onAdd = function(map: L.Map) {
          const result = originalOnAdd.call(this, map);
          
          // Force marker icon to be visible
          if (this._marker && this._marker._icon) {
            this._marker._icon.style.visibility = 'visible';
            this._marker._icon.style.opacity = '1';
            this._marker._icon.style.zIndex = '1000';
          }
          
          return result;
        };
      }
    }
    
    // Ensure the Draw.Polygon's vertex marker styling is correct
    if (L.Draw && L.Draw.Polygon) {
      // Add CSS to ensure vertex markers are visible
      const style = document.createElement('style');
      style.textContent = `
        .leaflet-marker-icon.leaflet-div-icon {
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 1000 !important;
        }
        .leaflet-marker-shadow {
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 999 !important;
        }
        .leaflet-draw-tooltip {
          visibility: visible !important;
          opacity: 1 !important;
          z-index: 1001 !important;
        }
      `;
      document.head.appendChild(style);
    }
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
    
    return () => {
      cleanup();
      clearInterval(intervalId);
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
