
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getMapFromLayer } from '@/utils/leaflet-type-utils';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Force SVG renderer but in a safer way
  useEffect(() => {
    // This effect will ensure all layers use SVG renderer
    if (!featureGroup) return;
    
    try {
      // Override the _updatePath method once the featureGroup is ready
      const pathPrototype = L.Path.prototype as any;
      if (!pathPrototype._originalUpdatePath) {
        pathPrototype._originalUpdatePath = pathPrototype._updatePath;
        
        pathPrototype._updatePath = function() {
          if (this.options && !this.options.renderer) {
            this.options.renderer = L.svg();
          }
          pathPrototype._originalUpdatePath.call(this);
        };
      }
    } catch (err) {
      console.error('Error setting up SVG renderer:', err);
    }
    
    return () => {
      // Restore original function when component unmounts
      try {
        const pathPrototype = L.Path.prototype as any;
        if (pathPrototype._originalUpdatePath) {
          pathPrototype._updatePath = pathPrototype._originalUpdatePath;
          delete pathPrototype._originalUpdatePath;
        }
      } catch (err) {
        console.error('Error restoring path prototype:', err);
      }
    };
  }, [featureGroup]);

  // Ensure draw controls remain visible
  useEffect(() => {
    const ensureControlsVisibility = () => {
      // Find and force visibility of draw control elements
      const drawControls = document.querySelectorAll('.leaflet-draw.leaflet-control');
      drawControls.forEach(control => {
        (control as HTMLElement).style.display = 'block';
        (control as HTMLElement).style.visibility = 'visible';
        (control as HTMLElement).style.opacity = '1';
        (control as HTMLElement).style.zIndex = '12000';
      });
      
      // Also ensure toolbar is visible
      const toolbars = document.querySelectorAll('.leaflet-draw-toolbar');
      toolbars.forEach(toolbar => {
        (toolbar as HTMLElement).style.display = 'block';
        (toolbar as HTMLElement).style.visibility = 'visible';
        (toolbar as HTMLElement).style.opacity = '1';
        (toolbar as HTMLElement).style.zIndex = '12000';
      });
    };
    
    // Run immediately and set up an interval to maintain visibility
    ensureControlsVisibility();
    const intervalId = setInterval(ensureControlsVisibility, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Make sure the edit control is properly disposed when component unmounts
  useEffect(() => {
    return () => {
      if (editControlRef.current && editControlRef.current._toolbars) {
        try {
          // Disable any active handlers before unmounting
          if (editControlRef.current._toolbars.edit) {
            Object.values(editControlRef.current._toolbars.edit._modes).forEach((mode: any) => {
              if (mode && mode.handler && mode.handler.disable && typeof mode.handler.disable === 'function') {
                try {
                  mode.handler.disable();
                } catch (err) {
                  console.error('Error disabling edit mode:', err);
                }
              }
            });
          }
        } catch (err) {
          console.error('Error cleaning up edit control:', err);
        }
      }
    };
  }, []);
  
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
      
      // Ensure the layer has proper edit handlers
      if (layer.enableEdit && typeof layer.enableEdit === 'function') {
        // Make sure the layer has proper editing capabilities
        try {
          layer._map = getMapFromLayer(featureGroup);
        } catch (err) {
          console.error('Error setting layer map reference:', err);
        }
      }
      
      // Create a properly structured shape object
      let shape: any = { type: layerType, layer };
      
      // Extract SVG path data if available
      if (layer._path) {
        shape.svgPath = layer._path.getAttribute('d');
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

  // Create edit control options with proper safeguards
  const editOptions = {
    position: 'topright',
    draw: {
      rectangle: true,
      polygon: true,
      circle: true,
      circlemarker: false,
      marker: true,
      polyline: false
    },
    edit: {
      selectedPathOptions: {
        maintainColor: false,
        opacity: 0.7
      },
      remove: true,
      edit: {
        noMissingHandlers: true  // Add this to prevent errors when handlers are missing
      }
    }
  };

  return (
    <EditControl
      ref={editControlRef}
      {...editOptions}
      onCreated={handleCreated}
      featureGroup={featureGroup}  // Pass featureGroup at the top level for our wrapper to use
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
