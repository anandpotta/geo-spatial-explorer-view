
import { useState } from 'react';
import { useDropdownLocations } from '@/hooks/useDropdownLocations';
import { useToast } from "@/components/ui/use-toast";
import { createMarker, deleteMarker } from '@/utils/marker-utils';
import { toast } from 'sonner';

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

  const handleSelectLocation = (position: [number, number], isMapReady: boolean, onLocationSelect?: (position: [number, number]) => void) => {
    console.log("Location selected from SavedLocationsDropdown:", position);
    console.log("Direct callback provided:", !!onLocationSelect);
    
    // Close the dropdown first
    setIsDropdownOpen(false);
    
    // Use ONLY the direct callback for navigation to avoid map reloading
    if (onLocationSelect) {
      console.log("Using direct callback for smooth navigation");
      onLocationSelect(position);
      toast.success(`Navigating to saved location`);
    } else {
      console.log("No direct callback available, navigation may reload map");
      // Fallback to global handler only if no direct callback
      if (window.handleSavedLocationSelect) {
        console.log("Using global handler as last resort");
        window.handleSavedLocationSelect(position);
      }
    }
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
    handleSelectLocation,
    cleanupMarkerReferences
  };
};
