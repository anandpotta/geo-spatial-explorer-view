
import { useState, useEffect } from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from './CesiumMap';
import LeafletMap from './LeafletMap';
import LocationSearch from './LocationSearch';
import DrawingTools from './DrawingTools';
import SavedLocations from './SavedLocations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe2, Map as MapIcon, Bookmark } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const GeoSpatialExplorer = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>();
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium');
  const [isMapReady, setIsMapReady] = useState(false);
  const [flyCompleted, setFlyCompleted] = useState(false);
  const { toast } = useToast();
  
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setCurrentView('cesium');
    setFlyCompleted(false);
    
    toast({
      title: 'Location selected',
      description: location.label,
      duration: 3000,
    });
  };
  
  const handleFlyComplete = () => {
    setFlyCompleted(true);
    setCurrentView('leaflet');
    
    toast({
      title: 'Navigation complete',
      description: 'Switched to detailed map view',
      duration: 3000,
    });
  };
  
  const handleSavedLocationSelect = (position: [number, number]) => {
    // Create a simple location object from coordinates
    const location: Location = {
      id: `loc-${position[0]}-${position[1]}`,
      label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
      y: position[0],
      x: position[1]
    };
    
    setSelectedLocation(location);
    setCurrentView('leaflet'); // Go directly to leaflet view for saved locations
  };
  
  return (
    <div className="w-full h-screen flex bg-background">
      {/* Left Panel */}
      <div className="w-96 h-full bg-card border-r overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">GeoSpatial Explorer</h1>
          <p className="text-muted-foreground">Search, navigate and mark locations</p>
        </div>
        
        <Tabs defaultValue="search" className="flex-1 flex flex-col">
          <div className="border-b px-4">
            <TabsList className="w-full">
              <TabsTrigger value="search" className="flex-1">
                <MapIcon size={16} className="mr-2" /> Search
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">
                <Bookmark size={16} className="mr-2" /> Saved
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="search" className="flex-1 p-4">
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
          </TabsContent>
          
          <TabsContent value="saved" className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Saved Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <SavedLocations onLocationSelect={handleSavedLocationSelect} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right Panel - Map View */}
      <div className="flex-1 relative">
        {/* The actual search component positioned absolutely on top of the map */}
        <LocationSearch onLocationSelect={handleLocationSelect} />
        
        {/* Map container */}
        <div className="w-full h-full relative">
          {currentView === 'cesium' && (
            <CesiumMap 
              selectedLocation={selectedLocation}
              onMapReady={() => setIsMapReady(true)}
              onFlyComplete={handleFlyComplete}
            />
          )}
          
          {currentView === 'leaflet' && selectedLocation && (
            <LeafletMap selectedLocation={selectedLocation} />
          )}
          
          {/* Drawing tools displayed only in leaflet view */}
          {currentView === 'leaflet' && (
            <DrawingTools 
              onToolSelect={(tool) => console.log('Selected tool:', tool)}
              onZoomIn={() => console.log('Zoom in')}
              onZoomOut={() => console.log('Zoom out')}
              onReset={() => console.log('Reset view')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GeoSpatialExplorer;
