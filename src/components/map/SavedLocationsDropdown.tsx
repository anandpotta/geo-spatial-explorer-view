
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import DeleteLocationDialog from '@/components/saved-locations/DeleteLocationDialog';
import SavedLocationsDropdownContent from './dropdown/SavedLocationsDropdownContent';
import { useSavedLocationsDropdown } from '@/hooks/useSavedLocationsDropdown';

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
  isMapReady?: boolean;
}

const SavedLocationsDropdown: React.FC<SavedLocationsDropdownProps> = ({ 
  onLocationSelect,
  isMapReady = false
}) => {
  const {
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
  } = useSavedLocationsDropdown();

  // Simple direct navigation that just calls the provided callback
  const handleDirectNavigation = (position: [number, number]) => {
    console.log("SavedLocationsDropdown direct navigation to:", position);
    
    // Close dropdown immediately
    setIsDropdownOpen(false);
    
    // Call the callback directly - this should be the map's flyTo function
    onLocationSelect(position);
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
          <SavedLocationsDropdownContent
            markers={markers}
            isAddingLocation={isAddingLocation}
            newLocationName={newLocationName}
            newLocationLat={newLocationLat}
            newLocationLng={newLocationLng}
            onSelect={handleDirectNavigation}
            onDelete={handleDeleteClick}
            onStartAddingLocation={() => setIsAddingLocation(true)}
            onNameChange={setNewLocationName}
            onLatChange={setNewLocationLat}
            onLngChange={setNewLocationLng}
            onSave={handleAddLocation}
          />
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
