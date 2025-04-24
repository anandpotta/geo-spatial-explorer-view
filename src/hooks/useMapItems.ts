
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';
import { Annotation, getSavedAnnotations } from '@/utils/annotation-utils';

export interface MapItems {
  markers: LocationMarker[];
  annotations: Annotation[];
  isLoading: boolean;
  error: Error | null;
}

export function useMapItems() {
  const [items, setItems] = useState<MapItems>({
    markers: [],
    annotations: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadItems = () => {
      try {
        const markers = getSavedMarkers();
        const annotations = getSavedAnnotations();
        
        setItems({
          markers,
          annotations,
          isLoading: false,
          error: null
        });
        
        console.log('Loaded items from localStorage:', { 
          markerCount: markers.length, 
          annotationCount: annotations.length 
        });
      } catch (error) {
        console.error('Error loading map items:', error);
        setItems(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to load map items')
        }));
      }
    };

    // Initial load
    loadItems();

    // Listen for storage changes
    const handleStorage = () => {
      console.log('Storage changed, reloading items');
      loadItems();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('markersUpdated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('markersUpdated', handleStorage);
    };
  }, []);

  return items;
}
