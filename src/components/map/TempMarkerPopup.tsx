
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
    console.log('TempMarkerPopup: Saving marker:', markerName);
    onSave();
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    console.log('TempMarkerPopup: Popup content clicked');
    e.stopPropagation();
    e.preventDefault();
  };

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
        className="bg-white p-3 rounded-lg shadow-lg min-w-[300px]"
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
