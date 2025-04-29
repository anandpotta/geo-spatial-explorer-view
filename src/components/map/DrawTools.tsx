
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getCoordinatesFromLayer, getSvgPathFromLayer } from '@/utils/leaflet-drawing-config';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  
  useImperativeHandle(ref, () => ({
    getEditControl: () => editControlRef.current,
    getCurrentPath: () => currentPath
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
            
            // Generate SVG path string
            const svgPath = getSvgPathFromLayer(layer, layerType);
            shape.svgPath = svgPath;
            setCurrentPath(svgPath);
            
            // Log the path data for debugging
            console.log(`Shape path data:`, {
              coordinates: shape.coordinates,
              svgPath: shape.svgPath
            });
          }
        } else if (layerType === 'circle') {
          const center = layer.getLatLng();
          shape.coordinates = [[center.lat, center.lng]];
          shape.radius = layer.getRadius();
          
          // For circles, we also create a simplified path representation
          const svgPath = `M ${center.lng},${center.lat} m -${layer.getRadius()},0 a ${layer.getRadius()},${layer.getRadius()} 0 1,0 ${layer.getRadius()*2},0 a ${layer.getRadius()},${layer.getRadius()} 0 1,0 -${layer.getRadius()*2},0`;
          shape.svgPath = svgPath;
          setCurrentPath(svgPath);
          
          console.log(`Circle path data:`, {
            center: [center.lat, center.lng],
            radius: layer.getRadius(),
            svgPath: shape.svgPath
          });
        }
      }
      
      // Also capture path data for polylines
      else if (layerType === 'polyline') {
        const latLngs = layer.getLatLngs();
        if (Array.isArray(latLngs) && latLngs.length > 0) {
          const points = Array.isArray(latLngs[0]) ? latLngs[0] : latLngs;
          shape.coordinates = points.map((ll: L.LatLng) => [ll.lat, ll.lng]);
          
          // Generate SVG path string without closing (Z) command
          let svgPath = `M ${shape.coordinates[0][1]},${shape.coordinates[0][0]}`;
          for (let i = 1; i < shape.coordinates.length; i++) {
            svgPath += ` L ${shape.coordinates[i][1]},${shape.coordinates[i][0]}`;
          }
          shape.svgPath = svgPath;
          setCurrentPath(svgPath);
          
          console.log(`Polyline path data:`, {
            coordinates: shape.coordinates,
            svgPath: shape.svgPath
          });
        }
      }
      
      onCreated(shape);
    } catch (err) {
      console.error('Error handling created shape:', err);
      toast.error('Error creating shape');
    }
  };

  return (
    <>
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
          polyline: true // Enable polyline drawing
        }}
        edit={{
          remove: true
        }}
        featureGroup={featureGroup}  // Pass featureGroup at the top level for our wrapper to use
      />
      {currentPath && (
        <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded-md text-xs text-gray-700 z-50 max-w-xs overflow-auto">
          <p className="font-bold">Path Data:</p>
          <code className="block break-all whitespace-pre-wrap">{currentPath}</code>
        </div>
      )}
    </>
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
