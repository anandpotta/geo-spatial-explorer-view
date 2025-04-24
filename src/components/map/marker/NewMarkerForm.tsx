
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
  const popupRef = useRef<any>(null);

  // Focus the input field when the component mounts with multiple fallbacks
  useEffect(() => {
    // Series of timers to ensure we try focusing multiple times
    const attempts = [100, 300, 600, 1000]; 
    
    attempts.forEach(delay => {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          try {
            inputRef.current.focus();
            // Set cursor at the end of the text
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
            console.log('Input focused after', delay, 'ms');
          } catch (e) {
            console.warn('Failed to focus input:', e);
          }
        }
      }, delay);
      
      return () => attempts.forEach((_, i) => clearTimeout(i));
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  }, [onSave]);

  // Handle input change with full propagation prevention
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkerName(e.target.value);
    
    // Set global flags
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    
    // Ensure popup stays open
    if (popupRef.current) {
      popupRef.current._source._popup.setContent(popupRef.current._content);
    }
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
    
    // Re-focus input if we click the form
    if (inputRef.current && e.target !== inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, []);

  return (
    <Popup 
      ref={popupRef}
      closeButton={false} 
      autoClose={false} 
      autoPan={false}
      className="marker-form-popup"
      onOpen={() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }}
    >
      <div 
        onClick={stopPropagation} 
        className="popup-container"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
      >
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
            onClick={(e) => {
              e.stopPropagation();
              window.tempMarkerPlaced = true;
              window.userHasInteracted = true;
            }}
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
