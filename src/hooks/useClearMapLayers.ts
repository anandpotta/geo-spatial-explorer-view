
import { useCallback } from 'react';
import L from 'leaflet';

interface ClearLayersProps {
  mapRef: React.RefObject<L.Map>;
  setMapInstanceKey: (key: number) => void;
  setTempMarker: (marker: [number, number] | null) => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'building' | 'area' | 'pin') => void;
  setCurrentDrawing: (drawing: any) => void;
  setShowFloorPlan: (show: boolean) => void;
  setSelectedDrawing: (drawing: any) => void;
  setMarkers: (markers: any[]) => void;
  setDrawings: (drawings: any[]) => void;
}

export function useClearMapLayers({
  mapRef,
  setMapInstanceKey,
  setTempMarker,
  setMarkerName,
  setMarkerType,
  setCurrentDrawing,
  setShowFloorPlan,
  setSelectedDrawing,
  setMarkers,
  setDrawings
}: ClearLayersProps) {
  const handleClearAll = useCallback(() => {
    setTempMarker(null);
    setMarkerName('');
    setMarkerType('building');
    setCurrentDrawing(null);
    setShowFloorPlan(false);
    setSelectedDrawing(null);
    setMarkers([]);
    setDrawings([]);
    
    if (mapRef.current) {
      try {
        mapRef.current.eachLayer(layer => {
          if (!(layer instanceof L.TileLayer)) {
            mapRef.current?.removeLayer(layer);
          }
        });
        
        mapRef.current.invalidateSize(true);
      } catch (err) {
        console.error('Error clearing map layers:', err);
      }
    }
    
    setMapInstanceKey(Date.now());
    
    // Dispatch custom events separately
    window.dispatchEvent(new CustomEvent('markersUpdated'));
    
    // Use a custom event name instead of 'storage'
    window.dispatchEvent(new CustomEvent('mapLayersClearEvent'));
  }, [
    mapRef,
    setMapInstanceKey,
    setTempMarker,
    setMarkerName,
    setMarkerType,
    setCurrentDrawing,
    setShowFloorPlan,
    setSelectedDrawing,
    setMarkers,
    setDrawings
  ]);

  return { handleClearAll };
}
