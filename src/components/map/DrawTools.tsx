
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
  const isEditModeActive = useRef<boolean>(false);
  
  // Force SVG renderer but in a safer way
  useEffect(() => {
    // Instead of trying to modify the read-only property, configure the renderer
    // when creating layers
    const pathPrototype = L.Path.prototype as any; // Cast to any to access internal methods
    const originalUpdatePath = pathPrototype._updatePath;
    
    pathPrototype._updatePath = function() {
      if (this.options && !this.options.renderer) {
        this.options.renderer = L.svg();
      }
      originalUpdatePath.call(this);
      
      // Add drawing ID to path element if available
      if (this._path && this.drawingId) {
        this._path.setAttribute('data-drawing-id', this.drawingId);
        
        // Also set specific fill-opacity for elements with images
        if (this._path.getAttribute('data-has-clip-mask') === 'true') {
          this._path.removeAttribute('fill-opacity');
        }
      }
    };
    
    return () => {
      // Restore original function when component unmounts
      pathPrototype._updatePath = originalUpdatePath;
    };
  }, []);
  
  // Handle switching between drawing and editing modes
  useEffect(() => {
    if (!editControlRef.current) return;
    
    // Safely check if edit mode should be activated or deactivated
    const safelyToggleEditMode = () => {
      if (!editControlRef.current) return;
      
      try {
        const editControl = editControlRef.current;
        const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
        
        // When activeTool is 'edit', enable edit mode if it's not already active
        if (activeTool === 'edit') {
          if (editHandler && !isEditModeActive.current && typeof editHandler.enable === 'function') {
            console.log('Activating edit mode');
            editHandler.enable();
            isEditModeActive.current = true;
          }
        } 
        // When activeTool is not 'edit', disable edit mode if it's active
        else if (isEditModeActive.current) {
          if (editHandler && typeof editHandler.disable === 'function') {
            console.log('Deactivating edit mode');
            editHandler.disable();
            isEditModeActive.current = false;
          }
        }
      } catch (err) {
        console.error('Error toggling edit mode:', err);
      }
    };
    
    // Use a delay to ensure the map is properly initialized
    setTimeout(safelyToggleEditMode, 100);
    
  }, [activeTool, editControlRef.current]);
  
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
            const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
            svgElements.forEach(svg => {
              const paths = svg.querySelectorAll('path.leaflet-interactive');
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
            const svgElements = container.querySelectorAll('.leaflet-overlay-pane svg, .leaflet-pane svg');
            svgElements.forEach(svg => {
              const paths = svg.querySelectorAll('path.leaflet-interactive');
              paths.forEach(path => {
                const d = path.getAttribute('d');
                if (d) {
                  pathData.push(d);
                }
              });
            });
          }
        }
      }
      return pathData;
    },
    activateEditMode: () => {
      try {
        if (editControlRef.current) {
          const editControl = editControlRef.current;
          const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
          
          if (editHandler && typeof editHandler.enable === 'function') {
            console.log('Manually activating edit mode');
            editHandler.enable();
            isEditModeActive.current = true;
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('Error manually activating edit mode:', err);
        return false;
      }
    }
  }));

  const handleCreated = (e: any) => {
    try {
      const { layerType, layer } = e;
      
      if (!layer) {
        console.error('No layer created');
        return;
      }
      
      // Create a properly structured shape object
      let shape: any = { type: layerType, layer };
      
      // Extract SVG path data if available
      if (layer._path) {
        shape.svgPath = layer._path.getAttribute('d');
        
        // Ensure any path we create has a unique class for easier finding
        layer._path.classList.add('leaflet-interactive-created');
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
      edit={{
        remove: true,
        edit: true
      }}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
