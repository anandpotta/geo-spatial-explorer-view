
import React from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Landmark, Home } from 'lucide-react';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building' | 'department';
  setMarkerType: (type: 'pin' | 'area' | 'building' | 'department') => void;
  onSave: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
}

const NewMarkerForm = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  onDelete,
  isEditing = false
}: NewMarkerFormProps) => {
  return (
    <Popup className="marker-popup">
      <div className="p-2 w-64 bg-white shadow-sm rounded-md">
        <h3 className="font-medium text-sm mb-2">
          {isEditing ? 'Edit Location' : 'New Location'}
        </h3>
        <Input 
          type="text"
          placeholder="Location name"
          value={markerName}
          onChange={(e) => setMarkerName(e.target.value)}
          className="mb-2 w-full"
        />
        <Select
          value={markerType}
          onValueChange={(value: 'pin' | 'area' | 'building' | 'department') => setMarkerType(value)}
        >
          <SelectTrigger className="w-full mb-2">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="building">
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" />
                Building
              </div>
            </SelectItem>
            <SelectItem value="department">
              <div className="flex items-center">
                <Landmark className="w-4 h-4 mr-2" />
                Department
              </div>
            </SelectItem>
            <SelectItem value="area">
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Area
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          {onDelete && (
            <Button 
              variant="destructive"
              onClick={onDelete}
              className="flex-1"
            >
              Remove
            </Button>
          )}
          <Button 
            onClick={onSave}
            disabled={!markerName.trim()}
            className="flex-1"
          >
            Save Location
          </Button>
        </div>
      </div>
    </Popup>
  );
};

export default NewMarkerForm;
