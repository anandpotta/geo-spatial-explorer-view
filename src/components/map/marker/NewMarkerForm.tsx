
import React, { useCallback, useRef } from 'react';
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
            type="text"
            placeholder="Location name"
            value={markerName}
            onChange={handleInputChange}
            onClick={stopPropagation}
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

