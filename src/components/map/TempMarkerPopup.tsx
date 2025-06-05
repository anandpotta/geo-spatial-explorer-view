
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

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false}
      closeButton={false}
      autoPan={true}
      maxWidth={320}
      minWidth={280}
      keepInView={true}
      interactive={true}
      className="temp-marker-popup"
    >
      <div 
        onClick={handlePopupClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ 
          minWidth: '280px',
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
