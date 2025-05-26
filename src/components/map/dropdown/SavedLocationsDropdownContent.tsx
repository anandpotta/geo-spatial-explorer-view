
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import LocationsList from './LocationsList';
import AddLocationForm from './AddLocationForm';
import { LocationMarker } from '@/utils/marker-utils';

interface SavedLocationsDropdownContentProps {
  markers: LocationMarker[];
  isAddingLocation: boolean;
  newLocationName: string;
  newLocationLat: number | undefined;
  newLocationLng: number | undefined;
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
  onStartAddingLocation: () => void;
  onNameChange: (value: string) => void;
  onLatChange: (value: number) => void;
  onLngChange: (value: number) => void;
  onSave: () => void;
}

const SavedLocationsDropdownContent: React.FC<SavedLocationsDropdownContentProps> = ({
  markers,
  isAddingLocation,
  newLocationName,
  newLocationLat,
  newLocationLng,
  onSelect,
  onDelete,
  onStartAddingLocation,
  onNameChange,
  onLatChange,
  onLngChange,
  onSave
}) => {
  return (
    <>
      <LocationsList
        markers={markers}
        onSelect={onSelect}
        onDelete={onDelete}
      />
      {!isAddingLocation ? (
        <div className="p-2">
          <Button variant="ghost" onClick={onStartAddingLocation}>
            <Plus className="mr-2 h-4 w-4" /> Add Location
          </Button>
        </div>
      ) : (
        <div className="p-2">
          <AddLocationForm
            newLocationName={newLocationName}
            newLocationLat={newLocationLat}
            newLocationLng={newLocationLng}
            onNameChange={onNameChange}
            onLatChange={onLatChange}
            onLngChange={onLngChange}
            onSave={onSave}
          />
        </div>
      )}
    </>
  );
};

export default SavedLocationsDropdownContent;
