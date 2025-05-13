
import React, { useState } from 'react';
import { ReactComponents } from '@/lib';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const { GlobeComponent, MapComponent } = ReactComponents;

interface Location {
  id: string;
  label: string;
  x: number; // longitude
  y: number; // latitude
}

const DEMO_LOCATIONS = [
  { id: 'nyc', label: 'New York', x: -74.006, y: 40.7128 },
  { id: 'london', label: 'London', x: -0.1278, y: 51.5074 },
  { id: 'tokyo', label: 'Tokyo', x: 139.6503, y: 35.6762 },
  { id: 'sydney', label: 'Sydney', x: 151.2093, y: -33.8688 },
  { id: 'rio', label: 'Rio de Janeiro', x: -43.1729, y: -22.9068 }
];

const LibraryDemo = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [activeTab, setActiveTab] = useState('globe');
  
  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };
  
  const handleGlobeReady = (api: any) => {
    setIsGlobeReady(true);
    console.log('Globe is ready with API:', api);
  };
  
  const handleMapReady = (api: any) => {
    setIsMapReady(true);
    console.log('Map is ready with API:', api);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">GeoSpatial Library Demo</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Select a Location:</h2>
        <div className="flex flex-wrap gap-2">
          {DEMO_LOCATIONS.map(location => (
            <Button
              key={location.id}
              variant={selectedLocation?.id === location.id ? "default" : "outline"}
              onClick={() => handleLocationSelect(location)}
            >
              {location.label}
            </Button>
          ))}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="globe">3D Globe</TabsTrigger>
          <TabsTrigger value="map">2D Map</TabsTrigger>
          <TabsTrigger value="info">API Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="globe" className="mt-0">
          <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
            <GlobeComponent 
              selectedLocation={selectedLocation || undefined}
              onReady={handleGlobeReady}
              onFlyComplete={() => console.log('Flight animation completed')}
              onError={(err) => console.error('Globe error:', err)}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isGlobeReady ? '✅ Globe is ready' : '⏳ Globe is initializing...'}
          </p>
        </TabsContent>
        
        <TabsContent value="map" className="mt-0">
          <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
            <MapComponent 
              selectedLocation={selectedLocation || undefined}
              onReady={handleMapReady}
              onLocationSelect={(loc) => console.log('Location selected:', loc)}
              onError={(err) => console.error('Map error:', err)}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isMapReady ? '✅ Map is ready' : '⏳ Map is initializing...'}
          </p>
        </TabsContent>
        
        <TabsContent value="info" className="mt-0">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Cross-Platform GeoSpatial Library</h3>
            <p className="mb-4">This library provides consistent interfaces for interactive globes and maps across:</p>
            <ul className="list-disc pl-5 mb-4">
              <li>React Web applications</li>
              <li>React Native mobile applications</li>
              <li>Angular applications</li>
            </ul>
            
            <h4 className="font-semibold mt-4">Selected Location:</h4>
            {selectedLocation ? (
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(selectedLocation, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 italic">No location selected</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryDemo;
