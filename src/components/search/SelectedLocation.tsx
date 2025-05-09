
import { Location } from '@/utils/geo-utils';

interface SelectedLocationProps {
  location: Location | null;
}

const SelectedLocation = ({ location }: SelectedLocationProps) => {
  if (!location) return null;
  
  return (
    <div className="mt-3 p-3 bg-accent rounded-md">
      <h3 className="font-medium">{location.label}</h3>
      <p className="text-sm text-muted-foreground">
        Lat: {location.y.toFixed(6)}, Lng: {location.x.toFixed(6)}
      </p>
    </div>
  );
};

export default SelectedLocation;
