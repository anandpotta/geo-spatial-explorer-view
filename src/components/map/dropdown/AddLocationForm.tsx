import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AddLocationFormProps {
  newLocationName: string;
  newLocationLat: number | undefined;
  newLocationLng: number | undefined;
  onNameChange: (value: string) => void;
  onLatChange: (value: number) => void;
  onLngChange: (value: number) => void;
  onSave: () => void;
}

const AddLocationForm = ({
  newLocationName,
  newLocationLat,
  newLocationLng,
  onNameChange,
  onLatChange,
  onLngChange,
  onSave
}: AddLocationFormProps) => {
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={newLocationName}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="lat">Latitude</Label>
        <Input
          id="lat"
          type="number"
          value={newLocationLat !== undefined ? newLocationLat.toString() : ""}
          onChange={(e) => onLatChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="lng">Longitude</Label>
        <Input
          id="lng"
          type="number"
          value={newLocationLng !== undefined ? newLocationLng.toString() : ""}
          onChange={(e) => onLngChange(parseFloat(e.target.value))}
        />
      </div>
      <Button variant="ghost" onClick={onSave}>
        Save Location
      </Button>
    </div>
  );
};

export default AddLocationForm;
