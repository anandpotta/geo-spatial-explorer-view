
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/markers/index';

export const useSavedLocations = () => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);

  useEffect(() => {
    const loadSavedMarkers = () => {
      try {
        const savedMarkers = getSavedMarkers();
        setMarkers(savedMarkers);
      } catch (error) {
        console.error('Error loading saved markers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedMarkers();
    
    // Listen for storage events or custom marker update events
    const handleStorageUpdate = () => {
      loadSavedMarkers();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('markersUpdated', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('markersUpdated', handleStorageUpdate);
    };
  }, []);

  return { markers, loading, selectedLocation, setSelectedLocation };
};
