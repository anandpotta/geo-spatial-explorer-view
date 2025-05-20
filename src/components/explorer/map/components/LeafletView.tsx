
import React from 'react';
import { Location } from '@/utils/geo-utils';
import LeafletMap from '../../../map/LeafletMap';

interface LeafletViewProps {
  selectedLocation: Location | undefined;
  onMapReady: (map: any) => void;
  activeTool: string | null;
  onClearAll: () => void;
  style: React.CSSProperties;
  mapKey: number;
}

const LeafletView: React.FC<LeafletViewProps> = ({ 
  selectedLocation,
  onMapReady,
  activeTool,
  onClearAll,
  style,
  mapKey
}) => {
  return (
    <div 
      className="absolute inset-0 transition-all duration-500 ease-in-out"
      style={style}
      data-map-type="leaflet"
    >
      <LeafletMap 
        selectedLocation={selectedLocation} 
        onMapReady={onMapReady}
        activeTool={activeTool}
        key={`leaflet-${mapKey}`}
        onClearAll={onClearAll}
      />
    </div>
  );
};

export default LeafletView;
