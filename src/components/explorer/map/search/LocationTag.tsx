
import React from 'react';
import { Location } from '@/utils/geo-utils';
import { createPortal } from 'react-dom';

interface LocationTagPortalProps {
  location: Location | null;
  markerPos: { x: number; y: number } | null;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapLoaded: boolean;
  onClose: () => void;
}

const LocationTagPortal: React.FC<LocationTagPortalProps> = ({ 
  location, 
  markerPos, 
  mapContainerRef, 
  mapLoaded,
  onClose 
}) => {
  if (!location || !markerPos || !mapContainerRef.current || !mapLoaded) {
    return null;
  }

  return createPortal(
    <div 
      style={{
        position: 'absolute',
        left: `${markerPos.x}px`,
        top: `${markerPos.y}px`,
        pointerEvents: 'auto',
      }}
    >
      {/* Use the existing LocationTag component from the other file */}
      <LocationTag location={location} onClose={onClose} />
    </div>,
    mapContainerRef.current
  );
};

// We're importing and reusing the existing LocationTag component
import { X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LocationTagProps {
  location: Location;
  onClose: () => void;
  style?: React.CSSProperties;
}

const LocationTag: React.FC<LocationTagProps> = ({ location, onClose, style }) => {
  return (
    <div 
      className="absolute bg-background border shadow-md rounded-md p-2 flex items-center gap-2 animate-fade-in z-[1000] max-w-[300px] transform -translate-x-1/2 translate-y-2"
      style={style}
    >
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

export { LocationTagPortal };
