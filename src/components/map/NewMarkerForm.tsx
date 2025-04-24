
import React from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: (e?: React.MouseEvent) => void;
}

const NewMarkerForm = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}: NewMarkerFormProps) => {
  // Handle form submission to prevent default refresh behavior
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  };
  
  // Handle input changes separately to prevent refreshes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkerName(e.target.value);
  };

  return (
    <Popup>
      <form onSubmit={handleSubmit} className="p-2" onClick={(e) => e.stopPropagation()}>
        <Input 
          type="text"
          placeholder="Location name"
          value={markerName}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          className="mb-2"
        />
        <div className="flex mb-2">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setMarkerType('pin');
            }}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setMarkerType('area');
            }}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              setMarkerType('building');
            }}
          >
            Building
          </Button>
        </div>
        <Button 
          type="submit"
          disabled={!markerName.trim()}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Save Location
        </Button>
      </form>
    </Popup>
  );
};

export default NewMarkerForm;
