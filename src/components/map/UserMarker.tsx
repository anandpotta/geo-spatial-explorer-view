
import React, { useCallback, useEffect, useRef } from 'react';
import { Marker } from 'react-leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import MarkerPopup from './MarkerPopup';
import L from 'leaflet';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { MapPin } from 'lucide-react';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  
  // Cleanup marker when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        const leafletElement = markerRef.current;
        if (leafletElement && leafletElement.remove) {
          try {
            leafletElement.remove();
          } catch (error) {
            console.error('Error removing marker:', error);
          }
        }
      }
    };
  }, []);
  
  const handleDragEnd = useCallback((e: any) => {
    const updatedMarker = e.target;
    const newPosition = updatedMarker.getLatLng();
    
    // Update marker position in local storage
    const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
      if (m.id === marker.id) {
        return {
          ...m,
          position: [newPosition.lat, newPosition.lng] as [number, number]
        };
      }
      return m;
    });
    
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch event to update other components
    window.dispatchEvent(new CustomEvent('markersUpdated'));
  }, [marker.id]);
  
  return (
    <Marker 
      position={marker.position} 
      key={`marker-${marker.id}`}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd
      }}
      ref={markerRef}
    >
      {/* Add permanent tooltip to the marker */}
      <L.Tooltip 
        permanent={true} 
        direction="top" 
        className="custom-leaflet-tooltip" 
        offset={[0, -10]}
      >
        <div className="font-medium text-sm">{marker.name}</div>
      </L.Tooltip>
      
      <MarkerPopup marker={marker} onDelete={onDelete} />
    </Marker>
  );
};

export default React.memo(UserMarker);
