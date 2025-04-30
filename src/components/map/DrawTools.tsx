
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
      const originalGetTooltipText = L.Draw.Polygon.prototype._getTooltipText;
      
      // Override the method to handle the error
      L.Draw.Polygon.prototype._getTooltipText = function() {
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
            renderer: L.svg()
          }
        },
        polygon: {
          shapeOptions: {
            renderer: L.svg(),
            // Explicitly set this to work around the tooltip error
            showArea: true
          }
        },
        circle: {
          shapeOptions: {
            renderer: L.svg()
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

