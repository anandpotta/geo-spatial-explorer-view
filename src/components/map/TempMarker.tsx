
import React, { useCallback, useRef } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarkerEvents } from '@/hooks/useMarkerEvents';
import { usePopupStyles } from '@/hooks/usePopupStyles';
import MarkerTypeButtons from './marker/MarkerTypeButtons';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const TempMarker = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}: TempMarkerProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const map = useMapEvents({});
  
  useMarkerEvents(map);
  usePopupStyles();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMarkerName(e.target.value);
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
  }, [setMarkerName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
  };

  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
  }, []);

  return (
    <Marker 
      key={`temp-marker-${position[0]}-${position[1]}-${Date.now()}`}
      position={position} 
      draggable={true}
      eventHandlers={{
        dragstart: (e) => {
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          window.userHasInteracted = true;
          window.tempMarkerPlaced = true;
        },
        dragend: (e) => {
          if (e.sourceTarget && e.sourceTarget._map) {
            e.sourceTarget._map._stop();
          }
          if (window.tempMarkerPositionUpdate) {
            const newPosition = e.target.getLatLng();
            window.tempMarkerPositionUpdate([newPosition.lat, newPosition.lng]);
          }
        }
      }}
    >
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
    </Marker>
  );
};

export default TempMarker;
