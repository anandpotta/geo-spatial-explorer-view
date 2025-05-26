
import { useState } from 'react';
import { useDropdownLocations } from '@/hooks/useDropdownLocations';
import { useToast } from "@/components/ui/use-toast";
import { createMarker, deleteMarker } from '@/utils/marker-utils';

export const useSavedLocationsDropdown = () => {
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDeleteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    const marker = markers.find(m => m.id === id);
    if (marker) {
      setMarkerToDelete(marker);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
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
  };

  const handleAddLocation = async () => {
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
  };

  return {
    markers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    isAddingLocation,
    setIsAddingLocation,
    newLocationName,
    setNewLocationName,
    newLocationLat,
    setNewLocationLat,
    newLocationLng,
    setNewLocationLng,
    isDropdownOpen,
    setIsDropdownOpen,
    handleDeleteClick,
    handleConfirmDelete,
    handleAddLocation,
    cleanupMarkerReferences
  };
};
