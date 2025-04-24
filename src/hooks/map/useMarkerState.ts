
import { useState, useCallback } from 'react';
import { LocationMarker, saveMarker, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';

export function useMarkerState() {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');

  const handleDeleteMarker = useCallback((id: string) => {
    deleteMarker(id);
    toast.success("Location removed");
  }, []);

  const handleSaveMarker = useCallback(() => {
    if (!tempMarker || !markerName.trim()) {
      toast.error('Please provide a name for the marker');
      return;
    }
    
    const newMarker: LocationMarker = {
      id: crypto.randomUUID(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date()
    };
    
    saveMarker(newMarker);
    setTempMarker(null);
    setMarkerName('');
    toast.success("Location saved successfully");
  }, [tempMarker, markerName, markerType]);

  return {
    markers,
    setMarkers,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    handleDeleteMarker,
    handleSaveMarker
  };
}
