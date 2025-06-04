
import React from 'react';
import { Popup } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';

interface TempMarkerPopupProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
  isProcessing: boolean;
  isPopupOpen: boolean;
  setIsPopupOpen: (open: boolean) => void;
}

const TempMarkerPopup: React.FC<TempMarkerPopupProps> = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isProcessing,
  isPopupOpen,
  setIsPopupOpen
}) => {
  const handleSave = () => {
    if (isProcessing) return;
    setIsPopupOpen(false);
    onSave();
  };

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false}
      closeButton={true}
      autoPan={true}
      className="marker-popup"
      maxWidth={300}
      minWidth={250}
      keepInView={true}
      eventHandlers={{
        popupopen: () => {
          console.log('Popup opened');
          setIsPopupOpen(true);
        },
        popupclose: () => {
          console.log('Popup closed');
          setIsPopupOpen(false);
        }
      }}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={handleSave}
        disabled={isProcessing}
      />
    </Popup>
  );
};

export default TempMarkerPopup;
