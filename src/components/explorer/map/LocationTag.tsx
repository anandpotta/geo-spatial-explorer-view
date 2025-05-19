
import React from 'react';
import { X, Tag } from 'lucide-react';
import { Location } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LocationTagProps {
  location: Location;
  onClose: () => void;
}

const LocationTag: React.FC<LocationTagProps> = ({ location, onClose }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-background border shadow-md rounded-md p-2 flex items-center gap-2 animate-fade-in z-[1000] max-w-[300px]">
      <Tag className="h-4 w-4 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{location.label}</p>
        <p className="text-xs text-muted-foreground">
          {location.y.toFixed(4)}°, {location.x.toFixed(4)}°
        </p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-destructive/10"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Close</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default LocationTag;
