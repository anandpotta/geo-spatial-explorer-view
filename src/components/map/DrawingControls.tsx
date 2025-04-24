
import { useEffect, useRef, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';
import { DrawingData, saveDrawing, getSavedDrawings } from '@/utils/drawing-utils';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
}

const DrawingControls = ({ onCreated, activeTool }: DrawingControlsProps) => {
  const editControlRef = useRef<any>(null);
  const featureGroupRef = useRef<any>(null);
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  
  // Load saved drawings when component mounts
  useEffect(() => {
    const loadDrawings = () => {
      const drawings = getSavedDrawings();
      setSavedDrawings(drawings);
    };
    
    loadDrawings();
    
    // Listen for storage changes
    window.addEventListener('storage', loadDrawings);
    return () => window.removeEventListener('storage', loadDrawings);
  }, []);
  
  // Render saved drawings
  useEffect(() => {
    if (!featureGroupRef.current || !savedDrawings.length) return;
    
    // Clear previous drawings
    featureGroupRef.current.clearLayers();
    
    // Add saved drawings to the map
    savedDrawings.forEach(drawing => {
      if (drawing.geoJSON) {
        try {
          const layer = L.geoJSON(drawing.geoJSON, {
            style: {
              color: drawing.properties.color || '#3388ff',
              weight: 3,
              opacity: 0.7,
              fillOpacity: 0.3,
              id: drawing.id
            }
          });
          
          layer.addTo(featureGroupRef.current);
          
          // Add popup with drawing name if available
          if (drawing.properties.name) {
            layer.bindPopup(drawing.properties.name);
          }
        } catch (error) {
          console.error('Error rendering drawing from GeoJSON:', error);
        }
      }
    });
  }, [savedDrawings]);
  
  useEffect(() => {
    if (!editControlRef.current || !activeTool) return;
    
    const leafletElement = editControlRef.current.leafletElement;
    if (!leafletElement) return;
    
    Object.keys(leafletElement._modes).forEach((mode) => {
      if (leafletElement._modes[mode].handler.enabled()) {
        leafletElement._modes[mode].handler.disable();
      }
    });

    if (activeTool === 'polygon' && leafletElement._modes.polygon) {
      leafletElement._modes.polygon.handler.enable();
      toast.info("Click on map to start drawing polygon");
    } else if (activeTool === 'marker' && leafletElement._modes.marker) {
      leafletElement._modes.marker.handler.enable();
      toast.info("Click on map to place marker");
    } else if (activeTool === 'circle' && leafletElement._modes.circle) {
      leafletElement._modes.circle.handler.enable();
      toast.info("Click on map to draw circle");
    } else if (activeTool === 'rectangle' && leafletElement._modes.rectangle) {
      leafletElement._modes.rectangle.handler.enable();
      toast.info("Click on map to draw rectangle");
    }
  }, [activeTool]);

  const handleCreated = (e: any) => {
    const { layerType, layer } = e;
    
    const id = uuidv4();
    
    if (layerType === 'marker' && 'getLatLng' in layer) {
      const markerLayer = layer as L.Marker;
      const { lat, lng } = markerLayer.getLatLng();
      onCreated({ type: 'marker', position: [lat, lng], id });
    } else {
      const layerWithOptions = layer as L.Path;
      const options = layerWithOptions.options || {};
      
      (options as any).id = id;
      (options as any).isDrawn = true;
      
      const geoJSON = layer.toGeoJSON();
      
      // Save the drawing to localStorage
      const drawingData: DrawingData = {
        id,
        type: layerType as any,
        coordinates: getCoordinatesFromLayer(layer, layerType),
        geoJSON,
        options,
        properties: {
          name: `New ${layerType}`,
          color: options.color || '#3388ff',
          createdAt: new Date()
        }
      };
      
      saveDrawing(drawingData);
      
      toast.success(`${layerType} created successfully`);
      onCreated({ 
        type: layerType, 
        layer, 
        geoJSON,
        id
      });
    }
  };
  
  // Helper function to extract coordinates from different layer types
  const getCoordinatesFromLayer = (layer: any, layerType: string): Array<[number, number]> => {
    if (layerType === 'polygon' || layerType === 'polyline') {
      return layer.getLatLngs()[0].map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);
    } else if (layerType === 'rectangle') {
      const bounds = layer.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();
      
      return [
        [southWest.lat, southWest.lng],
        [northEast.lat, southWest.lng],
        [northEast.lat, northEast.lng],
        [southWest.lat, northEast.lng]
      ];
    } else if (layerType === 'circle') {
      const center = layer.getLatLng();
      return [[center.lat, center.lng]];
    }
    return [];
  };

  return (
    <FeatureGroup ref={featureGroupRef}>
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
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
