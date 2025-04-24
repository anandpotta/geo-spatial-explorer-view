
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
    // Close dropdown when a location is selected
    const dropdown = document.querySelector('[data-state="open"]');
    if (dropdown) {
      const trigger = dropdown.previousElementSibling as HTMLButtonElement;
      if (trigger) trigger.click();
    }
    
    console.log("Location selected from dropdown:", position);
    
    // Call the provided onLocationSelect function with the position
    if (onLocationSelect) {
      onLocationSelect(position);
      toast.success("Navigating to saved location");
    }
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering parent elements
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
      
      // Reset focus to document.body as a fallback
      document.body.focus();
      
      // Wait for next frame before trying to return focus
      requestAnimationFrame(() => {
        try {
          if (returnFocusRef.current && document.body.contains(returnFocusRef.current)) {
            returnFocusRef.current.focus();
          } else {
            // Focus the dropdown trigger as a fallback
            const trigger = document.querySelector('.dropdown-trigger') as HTMLElement;
            if (trigger) trigger.focus();
            else document.body.focus();
          }
        } catch (e) {
          console.error("Error restoring focus:", e);
          document.body.focus();
        } finally {
          returnFocusRef.current = null;
        }
      });
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    
    // Reset focus to document.body as a fallback
    document.body.focus();
    
    // Wait for next frame before trying to return focus
    requestAnimationFrame(() => {
      try {
        if (returnFocusRef.current && document.body.contains(returnFocusRef.current)) {
          returnFocusRef.current.focus();
        } else {
          // Focus the dropdown trigger as a fallback
          const trigger = document.querySelector('.dropdown-trigger') as HTMLElement;
          if (trigger) trigger.focus();
          else document.body.focus();
        }
      } catch (e) {
        console.error("Error restoring focus:", e);
        document.body.focus();
      } finally {
        returnFocusRef.current = null;
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-[200px] dropdown-trigger">
            <Navigation className="mr-2 h-4 w-4" />
            Saved Locations {markers.length > 0 && `(${markers.length})`}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px] z-50 bg-popover">
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

      <AlertDialog open={isDeleteDialogOpen}>
        <AlertDialogContent 
          onEscapeKeyDown={cancelDelete}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            cancelDelete();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{markerToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                cancelDelete();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedLocationsDropdown;
