
import React from 'react';
import { Location } from '@/utils/geo-utils';
import { X, MapPin } from 'lucide-react';

interface SelectedLocationDisplayProps {
  selectedLocation: Location;
  onClear: () => void;
  isLeafletView: boolean;
}

const SelectedLocationDisplay: React.FC<SelectedLocationDisplayProps> = ({ 
  selectedLocation, 
  onClear,
  isLeafletView
}) => {
  if (!selectedLocation) return null;
  
  return (
    <div 
      className={`absolute bottom-8 left-4 z-[9000] animate-fade-in ${isLeafletView ? 'block' : 'hidden'}`}
    >
      <div className="bg-white rounded-lg shadow-lg p-3 pr-10 relative max-w-xs">
        <button 
          onClick={onClear} 
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Close location info"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-2">
          <div className="text-blue-500 mt-1">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-medium text-sm mb-1">{selectedLocation.label}</h3>
            <p className="text-xs text-gray-600">
              Lat: {selectedLocation.y.toFixed(4)}, Long: {selectedLocation.x.toFixed(4)}
            </p>
          </div>
        </div>
        
        <div className="absolute -top-2 -left-2 transform rotate-45 w-4 h-4 bg-white"></div>
      </div>
    </div>
  );
};

export default SelectedLocationDisplay;
