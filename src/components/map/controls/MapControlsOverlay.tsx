
import SavedLocationsDropdown from '../SavedLocationsDropdown';
import { Location } from '@/utils/geo-utils';

interface MapControlsOverlayProps {
  onLocationSelect: (position: [number, number]) => void;
}

const MapControlsOverlay = ({ onLocationSelect }: MapControlsOverlayProps) => {
  return (
    <div className="absolute top-4 right-4 z-[1000]" role="region" aria-label="Map controls">
      <SavedLocationsDropdown onLocationSelect={onLocationSelect} />
    </div>
  );
};

export default MapControlsOverlay;
