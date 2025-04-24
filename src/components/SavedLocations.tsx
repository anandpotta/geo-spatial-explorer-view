
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SavedLocationsProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocations = ({ onLocationSelect }: SavedLocationsProps) => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  
  const loadMarkers = () => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
  };
  
  useEffect(() => {
    loadMarkers();
    
    // Setup event listeners
    const handleStorage = () => {
      loadMarkers();
    };
    
    const handleMarkersUpdated = () => {
      loadMarkers();
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
  }, []);
  
  const handleDelete = (id: string) => {
    deleteMarker(id);
    loadMarkers();
  };
  
  const handleSelect = (position: [number, number]) => {
    onLocationSelect(position);
  };
  
  if (markers.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No saved locations yet</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2 p-2">
        {markers.map(marker => (
          <div 
            key={marker.id}
            className="flex items-center justify-between p-2 bg-accent rounded-md"
          >
            <div className="flex items-center gap-2">
              <div className="bg-map-pin text-white w-7 h-7 rounded-full flex items-center justify-center">
                <MapPin size={14} />
              </div>
              <div>
                <h3 className="font-medium text-sm">{marker.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(marker.createdAt, { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleSelect(marker.position)}
              >
                <MapPin size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDelete(marker.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SavedLocations;
