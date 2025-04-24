
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/marker-utils';
import { deleteDrawing } from '@/utils/drawing-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import { toast } from 'sonner';
import LocationMenuItem from './LocationMenuItem';
import DeleteLocationDialog from './DeleteLocationDialog';

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsDropdown = ({ onLocationSelect }: SavedLocationsDropdownProps) => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [markerToDelete, setMarkerToDelete] = useState<LocationMarker | null>(null);

  const loadMarkers = () => {
    console.log("Loading markers for dropdown");
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    const pinned = savedMarkers.filter(marker => marker.isPinned === true);
    setPinnedMarkers(pinned);
  };

  useEffect(() => {
    loadMarkers();
    const handleStorage = () => loadMarkers();
    const handleMarkersUpdated = () => loadMarkers();
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('markersUpdated', handleMarkersUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('markersUpdated', handleMarkersUpdated);
    };
  }, []);

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setMarkerToDelete(marker);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      if (markerToDelete.associatedDrawing) {
        deleteDrawing(markerToDelete.associatedDrawing);
      }
      loadMarkers();
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      toast.success("Location and associated data removed");
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
    }
  };

  const handleLocationSelect = (position: [number, number]) => {
    const dropdown = document.querySelector('[data-state="open"]');
    if (dropdown) {
      const trigger = dropdown.previousElementSibling as HTMLButtonElement;
      if (trigger) trigger.click();
    }
    
    onLocationSelect(position);
    toast.success("Navigating to saved location");
  };

  return (
    <>
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
                  <LocationMenuItem
                    key={`pinned-${marker.id}`}
                    marker={marker}
                    onSelect={handleLocationSelect}
                    onDelete={handleDelete}
                  />
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
                <LocationMenuItem
                  key={marker.id}
                  marker={marker}
                  onSelect={handleLocationSelect}
                  onDelete={handleDelete}
                />
              ))
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteLocationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        markerToDelete={markerToDelete}
        onConfirmDelete={confirmDelete}
        onCancel={() => setMarkerToDelete(null)}
      />
    </>
  );
};

export default SavedLocationsDropdown;
