
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Force SVG renderer for all new shapes
  useEffect(() => {
    // Add editing capability to all existing layers in the feature group
    if (featureGroup) {
      try {
        featureGroup.eachLayer((layer: any) => {
          if (layer && !layer.editing) {
            // Ensure each layer has editing capability
            if (layer instanceof L.Path) {
              // Use type assertion for PolyEdit
              const editHandler = new (L.Handler as any).PolyEdit(layer);
              
              // Add fallback methods as part of the handler
              if (!editHandler.disable) {
                editHandler.disable = function(this: L.Handler): void {
                  console.log("Disable called on layer without proper handler");
                };
              }
              
              if (!editHandler.enable) {
                editHandler.enable = function(this: L.Handler): void {
                  console.log("Enable called on layer without proper handler");
                };
              }
              
              // Assign the properly typed handler to layer.editing
              layer.editing = editHandler;
            }
          }
        });
      } catch (err) {
        console.error('Error initializing layer editing:', err);
      }
    }
    
    // Override Leaflet's circle and rectangle rendering to force SVG path creation
    const originalCircleInitialize = (L.Circle as any).prototype.initialize;
    const originalCircleRedraw = (L.Circle as any).prototype._updatePath;
    
    // Override Circle initialization to always use SVG renderer
    (L.Circle as any).prototype.initialize = function(...args: any[]) {
      if (!args[1]?.renderer) {
        if (!args[1]) args[1] = {};
        args[1].renderer = L.svg();
      }
      return originalCircleInitialize.apply(this, args);
    };
    
    // Ensure circle redraws properly generate SVG paths
    (L.Circle as any).prototype._updatePath = function() {
      originalCircleRedraw.call(this);
      if (this._path && !this._path.getAttribute('d')) {
        const d = this._renderer._curvePointsToPath([this._point]);
        if (d) this._path.setAttribute('d', d);
      }
    };
    
    // Do the same for Rectangle
    const originalRectInitialize = (L.Rectangle as any).prototype.initialize;
    
    (L.Rectangle as any).prototype.initialize = function(...args: any[]) {
      if (!args[1]?.renderer) {
        if (!args[1]) args[1] = {};
        args[1].renderer = L.svg();
      }
      return originalRectInitialize.apply(this, args);
    };
    
    return () => {
      // Restore original functions when component unmounts
      (L.Circle as any).prototype.initialize = originalCircleInitialize;
      (L.Circle as any).prototype._updatePath = originalCircleRedraw;
      (L.Rectangle as any).prototype.initialize = originalRectInitialize;
    };
  }, [featureGroup]);
  
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getPathElements: () => {
      const pathElements: SVGPathElement[] = [];
      // Find all SVG paths within the map container
      if (featureGroup) {
        const map = getMapFromLayer(featureGroup);
        if (map) {
          const container = map.getContainer();
          if (container) {
            const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
            svgElements.forEach(svg => {
              const paths = svg.querySelectorAll('path');
              paths.forEach(path => {
                pathElements.push(path as SVGPathElement);
              });
            });
          }
        }
      }
      return pathElements;
    },
    getSVGPathData: () => {
      const pathData: string[] = [];
      // Find all SVG paths within the map container
      if (featureGroup) {
        const map = getMapFromLayer(featureGroup);
        if (map) {
          const container = map.getContainer();
          if (container) {
            const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg');
            svgElements.forEach(svg => {
              const paths = svg.querySelectorAll('path');
              paths.forEach(path => {
                pathData.push(path.getAttribute('d') || '');
              });
            });
          }
        }
      }
      return pathData;
    }
  }));

  const handleCreated = (e: any) => {
    try {
      const { layerType, layer } = e;
      
      if (!layer) {
        console.error('No layer created');
        return;
      }
      
      // Ensure the layer has editing capability
      if (layer instanceof L.Path && !layer.editing) {
        // Create the edit handler with proper type
        const editHandler = new (L.Handler as any).PolyEdit(layer);
        
        // Add fallback methods with proper typing
        if (!editHandler.disable) {
          editHandler.disable = function(this: L.Handler): void {
            console.log("Disable called on layer without proper handler");
          };
        }
        
        if (!editHandler.enable) {
          editHandler.enable = function(this: L.Handler): void {
            console.log("Enable called on layer without proper handler");
          };
        }
        
        // Assign the properly typed handler
        layer.editing = editHandler;
      }
      
      // Create a properly structured shape object
      let shape: any = { type: layerType, layer };
      
      // Force rendering as SVG path
      if (layer.options) {
        layer.options.renderer = L.svg();
      }
      
      // Extract SVG path data if available
      if (layer._path) {
        shape.svgPath = layer._path.getAttribute('d');
      } else {
        // For circle or other shapes, try to regenerate the path
        setTimeout(() => {
          if (layer._path) {
            shape.svgPath = layer._path.getAttribute('d');
            onCreated(shape);
          }
        }, 10);
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
        }
        
        onCreated(shape);
      }, 50);
    } catch (err) {
      console.error('Error handling created shape:', err);
      toast.error('Error creating shape');
    }
  };

  // Make sure we don't try to enable edit mode on non-existing layers
  const editOptions = {
    featureGroup: featureGroup,
    edit: {
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    },
    remove: true
  };

  return (
    <EditControl
      ref={editControlRef}
      position="topright"
      onCreated={handleCreated}
      draw={{
        rectangle: true,
        polygon: true,
        circle: true,
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
