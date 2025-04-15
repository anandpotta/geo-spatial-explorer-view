
import React from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const NewMarkerForm = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}: NewMarkerFormProps) => {
  return (
    <Popup className="marker-popup">
      <div className="p-2 w-64 bg-white shadow-sm rounded-md">
        <h3 className="font-medium text-sm mb-2">New Location</h3>
        <Input 
          type="text"
          placeholder="Location name"
          value={markerName}
          onChange={(e) => setMarkerName(e.target.value)}
          className="mb-2 w-full"
        />
        <div className="flex space-x-1 mb-2">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => setMarkerType('pin')}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => setMarkerType('area')}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => setMarkerType('building')}
          >
            Building
          </Button>
        </div>
        <Button 
          onClick={onSave}
          disabled={!markerName.trim()}
          className="w-full"
        >
          Save Location
        </Button>
      </div>
    </Popup>
  );
};

export default NewMarkerForm;
