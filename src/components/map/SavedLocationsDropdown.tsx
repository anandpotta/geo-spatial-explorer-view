
import { useRef } from "react";
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
import MarkerMenuItem from "./dropdown/MarkerMenuItem";
import { deleteMarker } from "@/utils/marker-utils";
import { useDropdownLocations } from "@/hooks/useDropdownLocations";

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
    // First close dropdown before handling selection to prevent state update loops
    const dropdown = document.querySelector('[data-state="open"]');
    if (dropdown) {
      const trigger = dropdown.previousElementSibling as HTMLButtonElement;
      if (trigger) trigger.click();
    }
    
    // Wait a small tick before triggering location select to prevent state update loop
    setTimeout(() => {
      onLocationSelect(position);
      toast.success("Navigating to saved location");
    }, 0);
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
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
      
      setTimeout(() => {
        if (returnFocusRef.current) {
          try {
            returnFocusRef.current.focus();
          } catch (e) {
            document.body.focus();
          }
          returnFocusRef.current = null;
        }
      }, 0);
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    
    setTimeout(() => {
      if (returnFocusRef.current) {
        try {
          returnFocusRef.current.focus();
        } catch (e) {
          document.body.focus();
        }
        returnFocusRef.current = null;
      }
    }, 0);
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
        <DropdownMenuContent className="w-[200px] z-[9999] bg-popover shadow-md">
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) cancelDelete();
      }}>
        <AlertDialogContent onEscapeKeyDown={cancelDelete}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{markerToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedLocationsDropdown;
