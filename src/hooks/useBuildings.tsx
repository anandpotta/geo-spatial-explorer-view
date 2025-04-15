import { useState, useEffect, useCallback } from 'react';
import L from 'leaflet';
import { Location } from '@/utils/geo-utils';
import { saveBuilding, getSavedBuildings } from '@/utils/building-utils';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export const useBuildings = (mapRef: React.MutableRefObject<L.Map | null>, selectedLocation: Location | undefined) => {
  const [showBuildingDialog, setShowBuildingDialog] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const [buildingName, setBuildingName] = useState('');
  const [drawnLayers, setDrawnLayers] = useState<Record<string, L.Layer>>({});

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      loadSavedBuildings();
    }
  }, [selectedLocation]);

  const clearBuildingLayers = useCallback(() => {
    if (!mapRef.current) return;
    
    Object.values(drawnLayers).forEach(layer => {
      if (mapRef.current) mapRef.current.removeLayer(layer);
    });
    
    mapRef.current.eachLayer((layer: L.Layer) => {
      if (layer && 'options' in layer && layer.options && (layer.options as any).buildingId) {
        mapRef.current?.removeLayer(layer);
      }
    });
    
    setDrawnLayers({});
  }, [drawnLayers]);

  const loadSavedBuildings = useCallback(() => {
    if (!selectedLocation || !mapRef.current) return;
    
    clearBuildingLayers();
    
    const locationKey = `${selectedLocation.x.toFixed(4)}_${selectedLocation.y.toFixed(4)}`;
    const savedBuildings = getSavedBuildings(locationKey);
    const newDrawnLayers: Record<string, L.Layer> = {};
    
    savedBuildings.forEach(building => {
      try {
        const style = {
          color: '#3388ff',
          weight: 3,
          opacity: 0.7,
          fillColor: '#3388ff',
          fillOpacity: 0.3
        };
        
        const layer = L.geoJSON(building.geoJSON, { style }).addTo(mapRef.current!);
        
        if (layer && layer.options) {
          (layer.options as any).buildingId = building.id;
        }
        
        layer.bindPopup(building.name);
        
        newDrawnLayers[building.id] = layer;
      } catch (error) {
        console.error("Error rendering saved building:", error);
      }
    });
    
    setDrawnLayers(newDrawnLayers);
    
    if (savedBuildings.length > 0) {
      toast.info(`Loaded ${savedBuildings.length} building${savedBuildings.length === 1 ? '' : 's'} for this location`);
    }
  }, [selectedLocation, clearBuildingLayers]);

  const handleSaveBuilding = useCallback(() => {
    if (!currentDrawing || !buildingName.trim() || !selectedLocation || !mapRef.current) return;
    
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
    
    if (currentDrawing.layer) {
      if (currentDrawing.layer.options) {
        (currentDrawing.layer.options as any).buildingId = buildingData.id;
      }
      
      currentDrawing.layer.bindPopup(buildingName);
      
      setDrawnLayers(prev => ({
        ...prev,
        [buildingData.id]: currentDrawing.layer
      }));
    } else {
      loadSavedBuildings();
    }
    
    setCurrentDrawing(null);
    setBuildingName('');
    setShowBuildingDialog(false);
    
    toast.success("Building saved successfully");
  }, [currentDrawing, buildingName, selectedLocation, loadSavedBuildings]);

  return {
    showBuildingDialog,
    setShowBuildingDialog,
    currentDrawing,
    setCurrentDrawing,
    buildingName,
    setBuildingName,
    handleSaveBuilding,
    loadSavedBuildings,
    clearBuildingLayers
  };
};
