
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { deleteDrawing } from '@/utils/drawing-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Trash2 } from "lucide-react";
import { toast } from 'sonner';

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsDropdown = ({ onLocationSelect }: SavedLocationsDropdownProps) => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);

  const loadMarkers = () => {
    console.log("Loading markers for dropdown");
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    const pinned = savedMarkers.filter(marker => marker.isPinned === true);
    setPinnedMarkers(pinned);
  };

  useEffect(() => {
    // Initial load
    loadMarkers();
    
    // Setup event listeners
    const handleStorage = () => {
      console.log("Storage event detected");
      loadMarkers();
    };
    
    const handleMarkersUpdated = () => {
      console.log("Markers updated event detected");
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

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Get the marker being deleted
    const markerToDelete = markers.find(m => m.id === id);
    
    if (markerToDelete) {
      // Delete the marker
      deleteMarker(id);
      
      // If there's an associated drawing, delete it too
      if (markerToDelete.associatedDrawing) {
        deleteDrawing(markerToDelete.associatedDrawing);
      }
      
      // Refresh markers list
      loadMarkers();
      
      // Trigger storage events to update UI
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      
      toast.success("Location and associated data removed");
    }
  };
  
  const handleLocationSelect = (position: [number, number]) => {
    // Close the dropdown menu when a location is selected
    const dropdown = document.querySelector('[data-state="open"]');
    if (dropdown) {
      const trigger = dropdown.previousElementSibling as HTMLButtonElement;
      if (trigger) trigger.click();
    }
    
    console.log("Location selected from dropdown:", position);
    onLocationSelect(position);
    toast.success("Navigating to saved location");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-[200px]">
          <Navigation className="mr-2 h-4 w-4" />
          Saved Locations {markers.length > 0 && `(${markers.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] z-50">
        {pinnedMarkers.length > 0 && (
          <>
            <DropdownMenuLabel>Pinned Locations</DropdownMenuLabel>
            <DropdownMenuGroup>
              {pinnedMarkers.map((marker) => (
                <DropdownMenuItem
                  key={`pinned-${marker.id}`}
                  className="flex justify-between items-center"
                >
                  <div
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() => handleLocationSelect(marker.position)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {marker.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleDelete(marker.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel>All Locations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {markers.length === 0 ? (
            <DropdownMenuItem disabled>No saved locations</DropdownMenuItem>
          ) : (
            markers.map((marker) => (
              <DropdownMenuItem
                key={marker.id}
                className="flex justify-between items-center"
              >
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => handleLocationSelect(marker.position)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {marker.name}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleDelete(marker.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SavedLocationsDropdown;
