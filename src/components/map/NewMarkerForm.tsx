
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
    <Popup>
      <div className="p-2">
        <Input 
          type="text"
          placeholder="Location name"
          value={markerName}
          onChange={(e) => setMarkerName(e.target.value)}
          className="mb-2"
        />
        <div className="flex mb-2">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMarkerType('pin')}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMarkerType('area')}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1"
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
