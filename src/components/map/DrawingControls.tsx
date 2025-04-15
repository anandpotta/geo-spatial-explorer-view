
import { useEffect, useRef, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import L from 'leaflet';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool?: string | null;
  selectedBuildingId?: string | null;
}

const DrawingControls = ({ onCreated, activeTool, selectedBuildingId }: DrawingControlsProps) => {
  const editControlRef = useRef<any>(null);
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});
  
  // If we want to react to activeTool changes in the future
  useEffect(() => {
    if (activeTool && editControlRef.current) {
      console.log('Active drawing tool:', activeTool);
      
      // Get the leaflet draw control
      const drawControl = editControlRef.current?.leafletElement;
      
      // Activate the appropriate drawing tool based on activeTool
      if (drawControl && drawControl._toolbars && drawControl._toolbars.draw) {
        const toolbar = drawControl._toolbars.draw;
        
        switch (activeTool) {
          case 'polygon':
            toolbar._modes.polygon.handler.enable();
            break;
          case 'rectangle':
            toolbar._modes.rectangle.handler.enable();
            break;
          case 'circle':
            toolbar._modes.circle.handler.enable();
            break;
          case 'marker':
            toolbar._modes.marker.handler.enable();
            break;
        }
      }
    }
  }, [activeTool]);

  // Effect to highlight the selected building
  useEffect(() => {
    if (selectedBuildingId) {
      // Reset all layers to default style first
      Object.entries(drawnLayers).forEach(([id, layer]) => {
        // Check if the layer is a Path type and has setStyle
        if ('setStyle' in layer) {
          const pathLayer = layer as L.Path;
          pathLayer.setStyle({
            color: '#1EAEDB',
            weight: 3,
            opacity: 0.8,
            fillColor: '#D3E4FD',
            fillOpacity: 0.5
          });
        }
      });
      
      // Highlight the selected building
      if (drawnLayers[selectedBuildingId] && 'setStyle' in drawnLayers[selectedBuildingId]) {
        const selectedLayer = drawnLayers[selectedBuildingId] as L.Path;
        selectedLayer.setStyle({
          color: '#FFA500',       // Orange border
          weight: 4,              // Thicker border
          opacity: 1,             // Full opacity
          fillColor: '#FFD700',   // Gold fill
          fillOpacity: 0.7        // More opaque
        });
        
        // Bring to front to ensure visibility
        if ('bringToFront' in selectedLayer) {
          selectedLayer.bringToFront();
        }
        
        toast.info("Selected building highlighted on map");
      }
    }
  }, [selectedBuildingId, drawnLayers]);
  
  return (
    <FeatureGroup>
      <EditControl
        ref={editControlRef}
        position="topleft"
        onCreated={e => {
          const { layerType, layer } = e;
          
          const id = uuidv4();
          
          if (layerType === 'marker' && 'getLatLng' in layer) {
            const markerLayer = layer as L.Marker;
            const { lat, lng } = markerLayer.getLatLng();
            onCreated({ type: 'marker', position: [lat, lng], id });
          } else {
            const layerWithOptions = layer as L.Path;
            const options = layerWithOptions.options || {};
            
            // Apply styling to the drawn shapes - only apply to Path types (polygons, circles, rectangles)
            // Check if it's a Path by checking for setStyle method
            if (layerType === 'polygon' || layerType === 'rectangle') {
              // Check if the layer is a Path type and has setStyle
              if ('setStyle' in layer) {
                layer.setStyle({
                  color: '#1EAEDB',       // Border color - bright blue
                  weight: 3,              // Border width
                  opacity: 0.8,           // Border opacity
                  fillColor: '#D3E4FD',   // Fill color - soft blue
                  fillOpacity: 0.5        // Fill opacity
                });
              }
            } else if (layerType === 'circle') {
              // Check if the layer is a Path type and has setStyle
              if ('setStyle' in layer) {
                layer.setStyle({
                  color: '#1EAEDB',       // Border color - bright blue
                  weight: 3,              // Border width
                  opacity: 0.8,           // Border opacity
                  fillColor: '#D3E4FD',   // Fill color - soft blue
                  fillOpacity: 0.5        // Fill opacity
                });
              }
            }
            
            (options as any).id = id;
            (options as any).isDrawn = true;
            (options as any).buildingId = id;
            
            // Store the layer reference for later highlighting
            setDrawnLayers(prev => ({
              ...prev,
              [id]: layer
            }));
            
            // Convert to GeoJSON for storage
            const geoJSON = layer.toGeoJSON();
            console.log('GeoJSON:', geoJSON);
            
            toast.success(`${layerType} created successfully`);
            
            // Pass the layer to parent for proper tracking
            onCreated({ 
              type: layerType, 
              layer, // Pass the actual layer reference
              geoJSON,
              id
            });
          }
        }}
        draw={{
          rectangle: {
            shapeOptions: {
              color: '#1EAEDB',     // Border color
              weight: 3,            // Border width
              opacity: 0.8,         // Border opacity
              fillColor: '#D3E4FD', // Fill color
              fillOpacity: 0.5      // Fill opacity
            }
          },
          polygon: {
            shapeOptions: {
              color: '#1EAEDB',     // Border color
              weight: 3,            // Border width
              opacity: 0.8,         // Border opacity
              fillColor: '#D3E4FD', // Fill color
              fillOpacity: 0.5      // Fill opacity
            },
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: '<strong>Drawing error:</strong> Shapes cannot intersect!'
            }
          },
          circle: {
            shapeOptions: {
              color: '#1EAEDB',     // Border color
              weight: 3,            // Border width
              opacity: 0.8,         // Border opacity
              fillColor: '#D3E4FD', // Fill color
              fillOpacity: 0.5      // Fill opacity
            }
          },
          circlemarker: false,
          marker: true,
          polyline: false
        }}
      />
    </FeatureGroup>
  );
};

export default DrawingControls;
