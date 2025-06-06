
import React, { useState, useCallback, useMemo } from 'react';
import { useDropdownLocations } from '@/hooks/useDropdownLocations';
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import DeleteLocationDialog from '@/components/saved-locations/DeleteLocationDialog';
import LocationsList from './dropdown/LocationsList';
import AddLocationForm from './dropdown/AddLocationForm';
import { createMarker, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const SavedLocationsDropdown: React.FC<SavedLocationsDropdownProps> = ({ 
  onLocationSelect,
  isMapReady = false
}) => {
  const { toast: uiToast } = useToast();
  const {
    markers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    cleanupMarkerReferences
  } = useDropdownLocations();

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationLat, setNewLocationLat] = useState<number | undefined>(undefined);
  const [newLocationLng, setNewLocationLng] = useState<number | undefined>(undefined);
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoize markers to prevent unnecessary re-renders
  const memoizedMarkers = useMemo(() => markers, [markers]);

  const handleDeleteClick = useCallback((id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    const marker = memoizedMarkers.find(m => m.id === id);
    if (marker) {
      setMarkerToDelete(marker);
      setIsDeleteDialogOpen(true);
    }
  }, [memoizedMarkers, setMarkerToDelete, setIsDeleteDialogOpen]);

  const handleConfirmDelete = useCallback(() => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      uiToast({
        title: "Success",
        description: "Location removed",
      });
      
      cleanupMarkerReferences();
      document.body.focus();
    }
  }, [markerToDelete, setIsDeleteDialogOpen, setMarkerToDelete, uiToast, cleanupMarkerReferences]);

  const handleAddLocation = useCallback(async () => {
    if (!newLocationName || newLocationName.trim() === "") {
      uiToast({
        title: "Error",
        description: "Location name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (newLocationLat === undefined || newLocationLng === undefined) {
      uiToast({
        title: "Error",
        description: "Latitude and Longitude must be valid numbers.",
        variant: "destructive",
      });
      return;
    }

    const newMarker = {
      name: newLocationName,
      position: [newLocationLat, newLocationLng] as [number, number],
      type: 'pin' as const,
    };

    createMarker(newMarker);
      
    uiToast({
      title: "Success",
      description: "Location saved",
    });
    
    setNewLocationName("");
    setNewLocationLat(undefined);
    setNewLocationLng(undefined);
    setIsAddingLocation(false);
  }, [newLocationName, newLocationLat, newLocationLng, uiToast]);

  const handleSelectLocation = useCallback((position: [number, number]) => {
    if (isNavigating) {
      console.log("Navigation already in progress, ignoring request");
      return;
    }
    
    if (!isMapReady) {
      toast.warning("Map is not ready yet, please wait a moment and try again");
      return;
    }
    
    setIsNavigating(true);
    
    console.log("Selected location from dropdown:", position);
    onLocationSelect(position);
    toast.success(`Navigating to selected location`);
    
    // Close dropdown
    const dropdownTrigger = document.querySelector('[data-state="open"]');
    if (dropdownTrigger) {
      const closeEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      dropdownTrigger.dispatchEvent(closeEvent);
    }
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  }, [isNavigating, isMapReady, onLocationSelect]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Saved Locations <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white border shadow-lg z-[1002]">
          <LocationsList
            markers={memoizedMarkers}
            onSelect={handleSelectLocation}
            onDelete={handleDeleteClick}
          />
          {!isAddingLocation ? (
            <div className="p-2">
              <Button variant="ghost" onClick={() => setIsAddingLocation(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </div>
          ) : (
            <div className="p-2">
              <AddLocationForm
                newLocationName={newLocationName}
                newLocationLat={newLocationLat}
                newLocationLng={newLocationLng}
                onNameChange={setNewLocationName}
                onLatChange={setNewLocationLat}
                onLngChange={setNewLocationLng}
                onSave={handleAddLocation}
              />
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteLocationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        markerToDelete={markerToDelete}
        onConfirmDelete={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setMarkerToDelete(null);
          document.body.focus();
        }}
      />
    </>
  );
};

export default SavedLocationsDropdown;
