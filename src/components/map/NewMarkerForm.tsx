
import React, { useCallback, useEffect, useRef } from 'react';
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
  // Reference to the form element
  const formRef = useRef<HTMLFormElement>(null);
  
  // Handle form submission to prevent default refresh behavior
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  };
  
  // Create a memoized input change handler with improved event isolation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Update the name with the new value
    setMarkerName(e.target.value);
    
    // Set flags to prevent map interactions
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
  }, [setMarkerName]);
  
  // Handle button clicks without propagation
  const handleTypeSelect = useCallback((e: React.MouseEvent, type: 'pin' | 'area' | 'building') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set flags and update type
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    setMarkerType(type);
  }, [setMarkerType]);
  
  // Handle save click
  const handleSaveClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(e);
  }, [onSave]);
  
  // Add an effect to handle keyboard events globally when the form is active
  useEffect(() => {
    const preventMapKeyboardEvents = (e: KeyboardEvent) => {
      // Only prevent propagation if the event originated from our form
      if (formRef.current && formRef.current.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };
    
    // Add event listeners with capture phase to catch events before they bubble
    document.addEventListener('keydown', preventMapKeyboardEvents, true);
    document.addEventListener('keypress', preventMapKeyboardEvents, true);
    document.addEventListener('keyup', preventMapKeyboardEvents, true);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', preventMapKeyboardEvents, true);
      document.removeEventListener('keypress', preventMapKeyboardEvents, true);
      document.removeEventListener('keyup', preventMapKeyboardEvents, true);
    };
  }, []);

  // Prevent click propagation throughout the component
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
  }, []);

  return (
    <Popup 
      closeButton={false} 
      autoClose={false} 
      autoPan={false}
      className="marker-form-popup"
      onClick={stopPropagation}
    >
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="p-2" 
        onClick={stopPropagation}
      >
        <Input 
          type="text"
          placeholder="Location name"
          value={markerName}
          onChange={handleInputChange}
          onClick={stopPropagation}
          // Add specific event handlers for keyboard events
          onKeyDown={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          className="mb-2 z-50"
          autoFocus
          style={{ zIndex: 9999 }}
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
