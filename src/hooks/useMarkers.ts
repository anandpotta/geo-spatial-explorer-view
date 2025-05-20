
import { MutableRefObject, SetStateAction, Dispatch } from 'react';
import { LocationMarker } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useMarkers(
  mapRef: MutableRefObject<any>,
  setMarkers: Dispatch<SetStateAction<LocationMarker[]>>,
  setTempMarker: Dispatch<SetStateAction<[number, number] | null>>,
  setIsMarkerActive: Dispatch<SetStateAction<boolean>>,
  setMapInstanceKey: Dispatch<SetStateAction<number>>
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
      createdAt: new Date().toISOString()
    };

    setMarkers(prevMarkers => {
      const updatedMarkers = [...prevMarkers, newMarker];
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
    
    toast.success('Location saved');
  };

  const handleDeleteMarker = (id: string) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = prevMarkers.filter(marker => marker.id !== id);
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      return updatedMarkers;
    });
    
    toast.success('Location deleted');
  };

  return {
    handleMapClick,
    handleMarkerDragEnd,
    handleSaveMarker,
    handleDeleteMarker
  };
}
