
import { useState, useEffect } from 'react';
import { LocationMarker } from '@/utils/geo-utils';
import { saveMarker, deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useMarkerState(isAuthenticated: boolean, currentUser: any) {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  
  // Load existing markers when user changes or auth state changes
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Clear data when user logs out
      setMarkers([]);
      return;
    }
    
    console.log(`Loading markers for user: ${currentUser.id}`);
    
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    
    // Listen for marker updates
    const handleMarkersUpdated = () => {
      if (isAuthenticated && currentUser) {
        setMarkers(getSavedMarkers());
      }
    };
    
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    window.addEventListener('storage', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
      window.removeEventListener('storage', handleMarkersUpdated);
    };
  }, [isAuthenticated, currentUser]);

  // Set up global position update handler for draggable markers
  useEffect(() => {
    window.tempMarkerPositionUpdate = setTempMarker;
    
    return () => {
      delete window.tempMarkerPositionUpdate;
    };
  }, []);

  const handleSaveMarker = (currentDrawing: any = null) => {
    if (!isAuthenticated || !currentUser) {
      toast.error('Please log in to save locations');
      return;
    }
    
    if (!tempMarker || !markerName.trim()) return;
    
    const newMarker: LocationMarker = {
      id: uuidv4(),
      name: markerName,
      position: tempMarker,
      type: markerType,
      createdAt: new Date(),
      associatedDrawing: currentDrawing ? currentDrawing.id : undefined,
      userId: currentUser.id
    };
    
    // Clear the temporary marker first to prevent duplicate displays
    setTempMarker(null);
    
    // Save the marker
    saveMarker(newMarker);
    
    // Reset marker name
    setMarkerName('');
    
    // Update the markers state with the latest from storage
    setMarkers(getSavedMarkers());
    
    toast.success("Location saved successfully");
    
    return newMarker;
  };

  const handleDeleteMarker = (id: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to manage locations');
      return;
    }
    
    deleteMarker(id);
    // Update the markers state
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
