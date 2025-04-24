
import React, { useCallback } from 'react';
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
  
  // Create a memoized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // First ensure user interaction flags are set
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    // Update the name with the new value
    setMarkerName(e.target.value);
    
    // Reinforce flags after state update
    setTimeout(() => {
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    }, 0);
  }, [setMarkerName]);
  
  // Handle button clicks without propagation
  const handleTypeSelect = useCallback((e: React.MouseEvent, type: 'pin' | 'area' | 'building') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set flags first
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    // Update type
    setMarkerType(type);
    
    // Reinforce flags
    setTimeout(() => {
      window.tempMarkerPlaced = true;
      window.userHasInteracted = true;
    }, 0);
  }, [setMarkerType]);
  
  // Handle save click
  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(e);
  }, [onSave]);

  return (
    <Popup closeButton={false} autoClose={false} autoPan={false}>
      <form 
        onSubmit={handleSubmit} 
        className="p-2" 
        onClick={(e) => {
          e.stopPropagation();
          // Set flags to prevent map interactions
          window.tempMarkerPlaced = true;
          window.userHasInteracted = true;
        }}
      >
        <Input 
          type="text"
          placeholder="Location name"
          value={markerName}
          onChange={handleInputChange}
          onClick={(e) => {
            e.stopPropagation();
            // Set flags when clicking input
            window.tempMarkerPlaced = true;
            window.userHasInteracted = true;
          }}
          className="mb-2"
          autoFocus
        />
        <div className="flex mb-2">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => handleTypeSelect(e, 'pin')}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => handleTypeSelect(e, 'area')}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1"
            onClick={(e) => handleTypeSelect(e, 'building')}
          >
            Building
          </Button>
        </div>
        <Button 
          type="submit"
          disabled={!markerName.trim()}
          className="w-full"
          onClick={handleSaveClick}
        >
          Save Location
        </Button>
      </form>
    </Popup>
  );
};

export default NewMarkerForm;
