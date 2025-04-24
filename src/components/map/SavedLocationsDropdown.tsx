
import { useDropdownLocations } from "@/hooks/useDropdownLocations";
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteLocationDialog from "@/components/saved-locations/DeleteLocationDialog";
import MarkerMenuItem from "./dropdown/MarkerMenuItem";
import { deleteMarker } from "@/utils/marker-utils";

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsDropdown = ({ onLocationSelect }: SavedLocationsDropdownProps) => {
  const {
    markers,
    pinnedMarkers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    returnFocusRef
  } = useDropdownLocations();

  const handleLocationSelect = (position: [number, number]) => {
    // Close dropdown if it's open
    const dropdown = document.querySelector('[data-state="open"]');
    if (dropdown) {
      const trigger = dropdown.previousElementSibling as HTMLButtonElement;
      if (trigger) trigger.click();
    }
    
    console.log("Location selected from dropdown:", position);
    onLocationSelect(position);
    toast.success("Navigating to saved location");
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.currentTarget) {
      returnFocusRef.current = event.currentTarget as HTMLElement;
    }
    
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setMarkerToDelete(marker);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast.success("Location removed");
      
      // Delay focus return slightly to ensure the DOM has updated
      setTimeout(() => {
        if (returnFocusRef.current) {
          try {
            returnFocusRef.current.focus();
          } catch (e) {
            document.body.focus();
          }
          returnFocusRef.current = null;
        }
      }, 100);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    
    // Delay focus return slightly to ensure the DOM has updated
    setTimeout(() => {
      if (returnFocusRef.current) {
        try {
          returnFocusRef.current.focus();
        } catch (e) {
          document.body.focus();
        }
        returnFocusRef.current = null;
      }
    }, 100);
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
                  <MarkerMenuItem
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
                <MarkerMenuItem
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
        onCancel={cancelDelete}
      />
    </>
  );
};

export default SavedLocationsDropdown;
