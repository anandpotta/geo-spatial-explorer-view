
import React, { useEffect } from 'react';
import { Popup } from 'react-leaflet';
import NewMarkerForm from './NewMarkerForm';

interface TempMarkerPopupProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
  isProcessing: boolean;
  forceOpen?: boolean;
}

const TempMarkerPopup: React.FC<TempMarkerPopupProps> = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isProcessing,
  forceOpen = false
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

  // Log when popup renders
  useEffect(() => {
    console.log('TempMarkerPopup rendered, forceOpen:', forceOpen);
  }, [forceOpen]);

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false}
      closeButton={false}
      autoPan={true}
      maxWidth={350}
      minWidth={300}
      keepInView={true}
      interactive={true}
      className="temp-marker-popup"
      offset={[0, -45]}
    >
      <div 
        onClick={handlePopupClick}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ 
          minWidth: '300px',
          padding: '12px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-900">Add New Location</h3>
          <p className="text-xs text-gray-500">Enter details for this marker</p>
        </div>
        
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
