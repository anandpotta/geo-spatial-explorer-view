import { useState } from 'react';
import { Popup } from 'react-leaflet';
import { LocationMarker } from '@/utils/marker-utils';
import { Button } from '@/components/ui/button';
import { MapPin, MapPinOff, Trash2 } from 'lucide-react';

interface MarkerPopupProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const MarkerPopup = ({ marker, onDelete }: MarkerPopupProps) => {
  const [isPinned, setIsPinned] = useState(marker.isPinned || false);

  const handlePinToggle = () => {
    const updatedPinnedState = !isPinned;
    setIsPinned(updatedPinnedState);
    
    // Update the marker in localStorage
    const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = markers.map((m: LocationMarker) => 
      m.id === marker.id ? { ...m, isPinned: updatedPinnedState } : m
    );
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Popup>
      <div className="p-2">
        <h3 className="font-medium mb-2">{marker.name}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePinToggle}
            className="flex items-center gap-1"
          >
            {isPinned ? (
              <>
                <MapPinOff size={16} />
                Unpin
              </>
            ) : (
              <>
                <MapPin size={16} />
                Pin
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(marker.id)}
            className="flex items-center gap-1"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>
    </Popup>
  );
};

export default MarkerPopup;
