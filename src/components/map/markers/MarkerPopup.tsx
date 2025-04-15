import React from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { LocationMarker } from '@/utils/geo-utils';

interface MarkerPopupProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const MarkerPopup = ({ marker, onDelete }: MarkerPopupProps) => {
  return (
    <Popup>
      <div className="p-1">
        <h3 className="font-medium">{marker.name}</h3>
        <p className="text-xs text-muted-foreground">{marker.type}</p>
        <p className="text-xs">
          {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
        </p>
        <Button 
          variant="destructive" 
          size="sm" 
          className="mt-2"
          onClick={() => onDelete(marker.id)}
        >
          <Trash2 size={14} className="mr-1" /> Remove
        </Button>
      </div>
    </Popup>
  );
};

export default MarkerPopup;
