
import React, { useState, useEffect } from 'react';
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

  const handleSelectLocation = (position: [number, number]) => {
    console.log("Location selected from SavedLocationsDropdown:", position);
    
    if (isNavigating) {
      console.log("Navigation already in progress, ignoring request");
      return;
    }
    
    if (!isMapReady) {
      toast.warning("Map is not ready yet, please wait a moment and try again");
      return;
    }
    
    // Set navigating status to prevent multiple clicks
    setIsNavigating(true);
    
    // Close the dropdown first
    setIsDropdownOpen(false);
    
    // Create a location object that triggers the proper navigation flow
    // This mimics how the location search works
    const locationForNavigation = {
      id: `saved-location-${Date.now()}`,
      label: `Saved Location`,
      x: position[1], // longitude
      y: position[0]  // latitude
    };
    
    console.log("Triggering navigation to:", locationForNavigation);
    
    // Use the parent's navigation function which should handle the view switching
    // and smooth navigation properly
    if (window.handleSavedLocationSelect) {
      window.handleSavedLocationSelect(position);
    } else {
      // Fallback to direct call
      onLocationSelect(position);
    }
    
    // Show success toast
    toast.success(`Navigating to saved location`);
    
    // Reset navigating status after a delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 2000);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Saved Locations <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <LocationsList
            markers={markers}
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
