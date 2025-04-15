
import { useRef, useEffect } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';
import { useDrawingControls } from '@/hooks/useDrawingControls';
import { useLayerStyles } from '@/hooks/useLayerStyles';
import { getDrawingOptions, editOptions } from '@/config/drawingOptions';
import { toast } from 'sonner';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool?: string | null;
  selectedBuildingId?: string | null;
}

const DrawingControls = ({ onCreated, activeTool, selectedBuildingId }: DrawingControlsProps) => {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const { drawnLayers, setDrawnLayers, onDrawControlMounted, clearDrawnShapes } = useDrawingControls(activeTool);
  useLayerStyles(selectedBuildingId, drawnLayers);

  useEffect(() => {
    // Override Leaflet.draw's readableArea function to fix the "type is not defined" error
    if (L.Draw && L.GeometryUtil) {
      try {
        // Fix for the "type is not defined" error in leaflet-draw
        L.GeometryUtil.readableArea = function(area: number, isMetric: boolean) {
          const areaStr = isMetric
              ? area >= 10000
                  ? (area / 1000000).toFixed(2) + ' km²'
                  : area.toFixed(2) + ' m²'
              : area < 2589988.11
                  ? (area / 0.836127).toFixed(2) + ' sq ft'
                  : (area / 2589988.11).toFixed(2) + ' sq mi';
          
          return areaStr;
        };
        
        console.log("Patched Leaflet.draw area calculation");
      } catch (err) {
        console.error("Failed to patch Leaflet.draw:", err);
      }
    }
  }, []);

  const handleShapeCreated = (e: any) => {
    try {
      const { layerType, layer } = e;
      const id = uuidv4();
      
      console.log(`Shape created: ${layerType}`, layer);
      
      if ('setStyle' in layer && typeof layer.setStyle === 'function') {
        layer.setStyle({
          color: '#1EAEDB',
          weight: 4,
          opacity: 1,
          fillColor: '#D3E4FD',
          fillOpacity: 0.5
        });
      }

      // Set options and properties
      if (layer.options) {
        layer.options.id = id;
        layer.options.isDrawn = true;
        layer.options.buildingId = id;
      } else {
        layer.options = {
          id,
          isDrawn: true,
          buildingId: id
        };
      }

      // Store in drawn layers
      setDrawnLayers(prev => ({
        ...prev,
        [id]: layer
      }));

      // Convert to GeoJSON
      let geoJSON;
      try {
        geoJSON = layer.toGeoJSON();
      } catch (err) {
        console.error('Error converting to GeoJSON:', err);
        toast.error('Error saving shape');
        return;
      }

      // Call the onCreated callback
      console.log('Created shape:', layerType, geoJSON);
      toast.success(`${layerType} created successfully`);
      onCreated({ type: layerType, layer, geoJSON, id });
    } catch (error) {
      console.error('Error creating shape:', error);
      toast.error('Failed to create shape');
    }
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
      <EditControl
        position="topleft"
        onCreated={handleShapeCreated}
        draw={getDrawingOptions(activeTool)}
        edit={editOptions}
        onMounted={onDrawControlMounted}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
