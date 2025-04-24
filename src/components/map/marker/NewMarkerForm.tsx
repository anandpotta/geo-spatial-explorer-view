
import React, { useCallback, useEffect, useRef } from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkerTypeButtons from './MarkerTypeButtons';

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
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when the component mounts
  useEffect(() => {
    // Short timeout to ensure the DOM is fully rendered
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  }, [onSave]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkerName(e.target.value);
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
  }, [setMarkerName]);

  // Enhanced keyboard event handler for the input field
  const handleInputKeyEvents = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation for ALL keyboard events to prevent map interactions
    e.stopPropagation();
    
    // Set flags to indicate user interaction
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    // Handle Enter key to submit the form
    if (e.key === 'Enter' && markerName.trim()) {
      e.preventDefault();
      onSave();
    }
  }, [markerName, onSave]);

  // Stop click propagation to prevent map interactions
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
    >
      <div onClick={stopPropagation} className="popup-container">
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className="p-2" 
          onClick={stopPropagation}
          id="marker-form"
          name="marker-form"
        >
          <Input 
            ref={inputRef}
            type="text"
            placeholder="Location name"
            value={markerName}
            onChange={handleInputChange}
            onClick={stopPropagation}
            onKeyDown={handleInputKeyEvents}
            onKeyPress={handleInputKeyEvents}
            onKeyUp={handleInputKeyEvents}
            className="mb-2 z-50"
            autoFocus
            style={{ zIndex: 9999 }}
            id="marker-name"
            name="marker-name"
          />
          <MarkerTypeButtons 
            markerType={markerType}
            onTypeSelect={setMarkerType}
          />
          <Button 
            type="submit"
            disabled={!markerName.trim()}
            className="w-full"
            id="save-marker"
            name="save-marker"
          >
            Save Location
          </Button>
        </form>
      </div>
    </Popup>
  );
};

export default NewMarkerForm;
