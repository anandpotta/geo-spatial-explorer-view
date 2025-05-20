
import { MutableRefObject } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useMarkers(
  mapRef: MutableRefObject<any>,
  setMarkers: React.Dispatch<React.SetStateAction<LocationMarker[]>>,
  setTempMarker: React.Dispatch<React.SetStateAction<[number, number] | null>>,
  setIsMarkerActive: React.Dispatch<React.SetStateAction<boolean>>,
  setMapInstanceKey: React.Dispatch<React.SetStateAction<number>>
) {
  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    setTempMarker([lat, lng]);
  };

  const handleMarkerDragEnd = (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setTempMarker([lat, lng]);
  };

  const handleSaveMarker = (
    position: [number, number],
    name: string,
    type: 'pin' | 'area' | 'building'
  ) => {
    if (!name.trim()) {
      toast.error('Please enter a name for this location');
      return;
    }

    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: name.trim(),
      position,
      type,
      createdAt: new Date(),
      userId: 'default-user' // Adding userId as it's required by the type
    };

    setMarkers(prevMarkers => {
      const updatedMarkers = [...prevMarkers, newMarker];
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });

    // Broadcast marker changes
    window.dispatchEvent(new CustomEvent('markersUpdated'));
    
    toast.success('Location saved');
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = prevMarkers.filter(marker => marker.id !== id);
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
    
    toast.success('Location deleted');
    
    // Broadcast marker changes
    window.dispatchEvent(new CustomEvent('markersUpdated'));
  };

  return {
    handleMapClick,
    handleMarkerDragEnd,
    handleSaveMarker,
    handleDeleteMarker
  };
}
