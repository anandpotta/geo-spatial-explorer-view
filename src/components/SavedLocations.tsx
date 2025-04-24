
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface SavedLocationsProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocations = ({ onLocationSelect }: SavedLocationsProps) => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);
  
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
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setMarkerToDelete(marker);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      loadMarkers();
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast.success("Location removed");
    }
  };
  
  const handleSelect = (position: [number, number]) => {
    onLocationSelect(position);
    toast.success("Navigating to saved location");
  };
  
  if (markers.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No saved locations yet</p>
      </div>
    );
  }
  
  return (
    <>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{markerToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarkerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedLocations;
