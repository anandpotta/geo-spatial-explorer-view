
import { LocationMarker } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LocationListItemProps {
  marker: LocationMarker;
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event?: React.MouseEvent) => void;
  onRename: (id: string, event?: React.MouseEvent) => void;
}

const LocationListItem = ({ marker, onSelect, onDelete, onRename }: LocationListItemProps) => {
  return (
    <div className="flex items-center justify-between p-2 bg-accent rounded-md">
      <div className="flex items-center gap-2">
        <div className="bg-map-pin text-white w-7 h-7 rounded-full flex items-center justify-center">
          <MapPin size={14} />
        </div>
        <div>
          <h3 className="font-medium text-sm">{marker.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(marker.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onSelect(marker.position)}
          title="Navigate to location"
        >
          <MapPin size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => onRename(marker.id, e)}
          title="Rename location"
        >
          <Edit size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={(e) => onDelete(marker.id, e)}
          title="Delete location"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

export default LocationListItem;
