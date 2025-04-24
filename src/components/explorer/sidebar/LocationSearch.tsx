
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe2, Map as MapIcon } from 'lucide-react';
import { Location } from '@/utils/geo-utils';

interface LocationSearchProps {
  currentView: 'cesium' | 'leaflet';
  flyCompleted: boolean;
  selectedLocation: Location | undefined;
  setCurrentView: (view: 'cesium' | 'leaflet') => void;
}

const LocationSearch = ({ 
  currentView, 
  flyCompleted, 
  selectedLocation, 
  setCurrentView 
}: LocationSearchProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Location Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-4">
            Enter a location to search. The map will navigate from space to your destination.
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter a location..."
              className="w-full p-2 border rounded"
              onChange={(e) => {
                // This is just a placeholder UI element
                // The actual search is handled by the LocationSearch component
              }}
            />
            <Button 
              size="sm"
              className="absolute right-1 top-1"
            >
              Search
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium">Current View</h3>
          <div className="flex gap-2">
            <Button
              variant={currentView === 'cesium' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setCurrentView('cesium')}
            >
              <Globe2 size={16} className="mr-2" /> 3D Globe
            </Button>
            <Button
              variant={currentView === 'leaflet' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setCurrentView('leaflet')}
              disabled={!flyCompleted && !selectedLocation}
            >
              <MapIcon size={16} className="mr-2" /> Map View
            </Button>
          </div>
        </div>
        
        {selectedLocation && (
          <div className="mt-4 p-3 bg-accent rounded-md">
            <h3 className="font-medium">{selectedLocation.label}</h3>
            <p className="text-sm text-muted-foreground">
              Lat: {selectedLocation.y.toFixed(6)}, Lng: {selectedLocation.x.toFixed(6)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationSearch;
