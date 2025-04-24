
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
      try {
        const popup = popupRef.current._source._popup;
        if (popup && popup.isOpen && !popup.isOpen()) {
          popup.openOn(popupRef.current._source._map);
        }
      } catch (err) {
        console.warn('Error maintaining popup state:', err);
      }
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
    >
      <div 
        onClick={stopPropagation} 
        className="popup-container"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
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
              id="type-pin"
              name="type-pin"
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
              id="type-area"
              name="type-area"
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
              id="type-building"
              name="type-building"
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
              if (markerName.trim()) {
                onSave(e);
              }
            }}
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
