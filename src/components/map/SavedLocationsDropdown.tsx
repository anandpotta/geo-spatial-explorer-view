
import React, { useState, useEffect, useRef } from 'react';
import { useDropdownLocations } from '@/hooks/useDropdownLocations';
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MarkerMenuItem from "./dropdown/MarkerMenuItem";
import { deleteMarker } from "@/utils/marker-utils";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeleteLocationDialog from '@/components/saved-locations/DeleteLocationDialog';
import { LocationMarker } from '@/utils/geo-utils';

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsDropdown: React.FC<SavedLocationsDropdownProps> = ({ 
  onLocationSelect 
}) => {
  const { toast } = useToast();
  const {
    markers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    setMarkerToDelete,
    returnFocusRef,
    cleanupMarkerReferences
  } = useDropdownLocations();

  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationLat, setNewLocationLat] = useState<number | undefined>(undefined);
  const [newLocationLng, setNewLocationLng] = useState<number | undefined>(undefined);

  const handleLocationSelect = (position: [number, number]) => {
    onLocationSelect(position);
  };

  const handleDeleteClick = (marker: LocationMarker) => {
    setMarkerToDelete(marker);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (markerToDelete) {
      deleteMarker(markerToDelete.id);
      setIsDeleteDialogOpen(false);
      setMarkerToDelete(null);
      toast({
        title: "Success",
        description: "Location removed",
      });
      
      // Clean up any stale elements first
      cleanupMarkerReferences();
      
      // Reset focus to document.body as a fallback
      document.body.focus();
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setMarkerToDelete(null);
    
    // Clean up any stale elements first
    cleanupMarkerReferences();
    
    // Reset focus to document.body as a fallback
    document.body.focus();
  };

  const toggleAddLocation = () => {
    setIsAddingLocation(!isAddingLocation);
  };

  const handleAddLocation = async () => {
    if (!newLocationName || newLocationName.trim() === "") {
      toast({
        title: "Error",
        description: "Location name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (newLocationLat === undefined || newLocationLng === undefined) {
      toast({
        title: "Error",
        description: "Latitude and Longitude must be valid numbers.",
        variant: "destructive",
      });
      return;
    }

    const newMarker = {
      name: newLocationName,
      position: [newLocationLat, newLocationLng] as [number, number],
      id: crypto.randomUUID(),
      type: 'pin' as const,
      createdAt: new Date(),
    };

    try {
      // Save the marker using the utility function
      deleteMarker(newMarker.id); // First remove any existing marker with same ID if it exists
      saveMarker(newMarker); // Then save the new marker
      
      toast({
        title: "Success",
        description: "Location saved",
      });
      
      setNewLocationName("");
      setNewLocationLat(undefined);
      setNewLocationLng(undefined);
      setIsAddingLocation(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save location.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" >
            Saved Locations <MoreHorizontal className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {markers.map((marker) => (
            <MarkerMenuItem
              key={marker.id}
              marker={marker}
              onSelect={handleLocationSelect}
              onDelete={handleDeleteClick}
            />
          ))}
          {!isAddingLocation ? (
            <DropdownMenuContent className="p-2">
              <Button variant="ghost" onClick={toggleAddLocation}>
                <Plus className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </DropdownMenuContent>
          ) : (
            <DropdownMenuContent className="p-2">
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    value={newLocationLat !== undefined ? newLocationLat.toString() : ""}
                    onChange={(e) =>
                      setNewLocationLat(parseFloat(e.target.value))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    value={newLocationLng !== undefined ? newLocationLng.toString() : ""}
                    onChange={(e) =>
                      setNewLocationLng(parseFloat(e.target.value))
                    }
                  />
                </div>
                <Button variant="ghost" onClick={handleAddLocation}>
                  Save Location
                </Button>
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteLocationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        markerToDelete={markerToDelete}
        onConfirmDelete={handleConfirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
};

export default SavedLocationsDropdown;
