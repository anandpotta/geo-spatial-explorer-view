
import { useState, useEffect } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { saveBuilding, getSavedBuildings } from '@/utils/building-utils';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useBuildings = (mapRef: React.MutableRefObject<L.Map | null>, selectedLocation: Location | undefined) => {
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const [buildingName, setBuildingName] = useState('');

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      const locationKey = `${selectedLocation.x.toFixed(4)}_${selectedLocation.y.toFixed(4)}`;
      const savedBuildings = getSavedBuildings(locationKey);
      
      // Clear previous buildings
      if (mapRef.current) {
        mapRef.current.eachLayer((layer: L.Layer) => {
          if (layer && 'options' in layer && layer.options && (layer.options as any).buildingId) {
            mapRef.current?.removeLayer(layer);
          }
        });
      }
      
      // Add saved buildings to the map
      savedBuildings.forEach(building => {
        try {
          const layer = L.geoJSON(building.geoJSON, {
            style: {
              color: '#3388ff',
              weight: 3,
              opacity: 0.7,
              fillColor: '#3388ff',
              fillOpacity: 0.3
            }
          }).addTo(mapRef.current || new L.Map(document.createElement('div')));
          
          if (layer && layer.options) {
            (layer.options as any).buildingId = building.id;
          }
          
          layer.bindPopup(building.name);
        } catch (error) {
          console.error("Error rendering saved building:", error);
        }
      });
      
      toast.info(`Loaded ${savedBuildings.length} buildings for this location`);
    }
  }, [selectedLocation]);

  const handleSaveBuilding = () => {
    if (!currentDrawing || !buildingName.trim() || !selectedLocation) return;
    
    const locationKey = `${selectedLocation.x.toFixed(4)}_${selectedLocation.y.toFixed(4)}`;
    
    const buildingData = {
      id: currentDrawing.id || uuidv4(),
      name: buildingName,
      type: currentDrawing.type,
      geoJSON: currentDrawing.geoJSON,
      locationKey,
      location: {
        x: selectedLocation.x,
        y: selectedLocation.y,
        label: selectedLocation.label
      },
      createdAt: new Date()
    };
    
    saveBuilding(buildingData);
    setCurrentDrawing(null);
    setBuildingName('');
    setShowBuildingDialog(false);
    toast.success("Building saved successfully");
  };

  return {
    showBuildingDialog,
    setShowBuildingDialog,
    currentDrawing,
    setCurrentDrawing,
    buildingName,
    setBuildingName,
    handleSaveBuilding
  };
};
