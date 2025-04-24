
import { Button } from '@/components/ui/button';

interface MarkerTypeButtonsProps {
  markerType: 'pin' | 'area' | 'building';
  onTypeSelect: (type: 'pin' | 'area' | 'building') => void;
}

const MarkerTypeButtons = ({ markerType, onTypeSelect }: MarkerTypeButtonsProps) => {
  const handleTypeSelect = (e: React.MouseEvent, type: 'pin' | 'area' | 'building') => {
    e.preventDefault();
    e.stopPropagation();
    window.tempMarkerPlaced = true;
    window.userHasInteracted = true;
    onTypeSelect(type);
  };

  return (
    <div className="flex mb-2">
      <Button
        type="button"
        size="sm"
        variant={markerType === 'pin' ? 'default' : 'outline'}
        className="flex-1"
        onClick={(e) => handleTypeSelect(e, 'pin')}
        id="type-pin"
        name="type-pin"
      >
        Pin
      </Button>
      <Button
        type="button"
        size="sm"
        variant={markerType === 'area' ? 'default' : 'outline'}
        className="flex-1"
        onClick={(e) => handleTypeSelect(e, 'area')}
        id="type-area"
        name="type-area"
      >
        Area
      </Button>
      <Button
        type="button"
        size="sm"
        variant={markerType === 'building' ? 'default' : 'outline'}
        className="flex-1"
        onClick={(e) => handleTypeSelect(e, 'building')}
        id="type-building"
        name="type-building"
      >
        Building
      </Button>
    </div>
  );
};

export default MarkerTypeButtons;
