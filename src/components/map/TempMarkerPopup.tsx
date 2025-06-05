
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
}

const TempMarkerPopup: React.FC<TempMarkerPopupProps> = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isProcessing
}) => {
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isProcessing || !markerName.trim()) return;
    console.log('Save button clicked, saving marker:', markerName);
    onSave();
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    console.log('Popup clicked, preventing propagation');
    e.stopPropagation();
    e.preventDefault();
  };

  const handlePopupMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false}
      closeButton={true}
      autoPan={true}
      maxWidth={300}
      minWidth={250}
      keepInView={true}
      interactive={true}
      className="temp-marker-popup"
    >
      <div 
        onClick={handlePopupClick}
        onMouseDown={handlePopupMouseDown}
        style={{ 
          minWidth: '250px',
          padding: '4px',
          pointerEvents: 'all'
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
      </div>
    </Popup>
  );
};

export default TempMarkerPopup;
