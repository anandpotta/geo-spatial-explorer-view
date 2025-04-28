
import { useState, useEffect } from 'react';
import { LocationMarker } from '@/utils/geo-utils';
import { saveMarker, getSavedMarkers } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useMarkerState() {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');

  // Load existing markers on mount
  useEffect(() => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    const handleMarkersUpdated = () => {
      setMarkers(getSavedMarkers());
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, []);

  // Handle marker updates
  const handleSaveMarker = (currentDrawing: any = null) => {
    if (!tempMarker || !markerName.trim()) return;
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined
    };
    
    saveMarker(newMarker);
    setTempMarker(null);
    setMarkerName('');
    setMarkers(getSavedMarkers());
    toast.success("Location saved successfully");
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(markers.filter(marker => marker.id !== id));
    toast.success("Location removed");
  };

  return {
    markers,
    setMarkers,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    handleSaveMarker,
    handleDeleteMarker
  };
}
