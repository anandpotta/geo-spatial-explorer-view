
import { useState, useEffect } from 'react';
import { Popup } from 'react-leaflet';
import { LocationMarker } from '@/utils/markers/types';
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
    window.dispatchEvent(new Event('markersUpdated'));
  };

  // Set up a permanent tooltip when the marker is created
  useEffect(() => {
    // Find the marker element by its ID
    setTimeout(() => {
      const markerElement = document.querySelector(`.leaflet-marker-icon[data-marker-id="${marker.id}"]`);
      if (markerElement && !markerElement.querySelector('.marker-tooltip')) {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'marker-tooltip bg-white px-2 py-0.5 rounded shadow text-sm absolute z-50';
        tooltip.style.left = '25px'; // Position to the right of the marker
        tooltip.style.top = '0';
        tooltip.style.pointerEvents = 'none'; // Allow clicks to pass through
        tooltip.setAttribute('data-marker-tooltip-id', marker.id);
        tooltip.textContent = marker.name;
        
        // Add to marker
        markerElement.appendChild(tooltip);
      }
    }, 100); // Short delay to ensure the marker icon is rendered
    
    return () => {
      // Cleanup function - remove tooltip when component unmounts
      const tooltips = document.querySelectorAll(`[data-marker-tooltip-id="${marker.id}"]`);
      tooltips.forEach(tooltip => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      });
    };
  }, [marker.id, marker.name]);

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
