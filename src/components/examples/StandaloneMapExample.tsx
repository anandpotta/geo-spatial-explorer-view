
import React, { useState, useCallback } from 'react';
import { StandaloneMapComponent } from '@/lib/react/StandaloneMapComponent';
import { downloadEnhancedGeoJSON, storeEnhancedGeoJSONToAzureSQL } from '@/utils/enhanced-geojson-export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const StandaloneMapExample = () => {
  const [externalLocation, setExternalLocation] = useState<{
    latitude: number;
    longitude: number;
    searchString?: string;
  } | undefined>();
  
  const [showInternalSearch, setShowInternalSearch] = useState(true);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    searchString?: string;
  } | null>(null);

  // Azure SQL configuration
  const [azureConnectionString, setAzureConnectionString] = useState('');
  const [recordName, setRecordName] = useState('');
  const [isStoringToAzure, setIsStoringToAzure] = useState(false);

  // Example: Navigate to specific coordinates
  const navigateToNewYork = useCallback(() => {
    setExternalLocation({
      latitude: 40.7128,
      longitude: -74.0060,
      searchString: 'New York City, NY, USA'
    });
  }, []);

  const navigateToLondon = useCallback(() => {
    setExternalLocation({
      latitude: 51.5074,
      longitude: -0.1278,
      searchString: 'London, United Kingdom'
    });
  }, []);

  const navigateToTokyo = useCallback(() => {
    setExternalLocation({
      latitude: 35.6762,
      longitude: 139.6503,
      searchString: 'Tokyo, Japan'
    });
  }, []);

  // Handle location changes from the map
  const handleLocationChange = useCallback((location: {
    latitude: number;
    longitude: number;
    searchString?: string;
  }) => {
    setCurrentLocation(location);
    console.log('Location changed:', location);
  }, []);

  // Handle annotations changes
  const handleAnnotationsChange = useCallback((newAnnotations: any[]) => {
    setAnnotations(newAnnotations);
    console.log('Annotations updated:', newAnnotations);
  }, []);

  // Download enhanced GeoJSON with search location
  const handleDownloadGeoJSON = useCallback(() => {
    if (currentLocation) {
      downloadEnhancedGeoJSON({
        searchLocation: currentLocation,
        includeSearchMetadata: true,
        filename: `geospatial-data-${currentLocation.searchString?.replace(/[^a-zA-Z0-9]/g, '-') || 'location'}.geojson`
      });
      toast.success('GeoJSON downloaded with search location metadata!');
    } else {
      downloadEnhancedGeoJSON({
        includeSearchMetadata: false,
        filename: 'geospatial-data.geojson'
      });
      toast.success('GeoJSON downloaded!');
    }
  }, [currentLocation]);

  // Store to Azure SQL
  const handleStoreToAzureSQL = useCallback(async () => {
    if (!azureConnectionString.trim()) {
      toast.error('Please enter your Azure SQL connection string');
      return;
    }

    setIsStoringToAzure(true);
    
    try {
      const recordId = await storeEnhancedGeoJSONToAzureSQL({
        searchLocation: currentLocation || undefined,
        includeSearchMetadata: true,
        azureSQLConfig: {
          connectionString: azureConnectionString,
          recordName: recordName || `GeoJSON-${new Date().toISOString()}`
        }
      });
      
      toast.success(`GeoJSON stored to Azure SQL successfully! Record ID: ${recordId}`);
    } catch (error) {
      console.error('Error storing to Azure SQL:', error);
      toast.error('Failed to store GeoJSON to Azure SQL. Please check your connection string and try again.');
    } finally {
      setIsStoringToAzure(false);
    }
  }, [azureConnectionString, recordName, currentLocation]);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Control Panel */}
      <Card className="m-4 mb-0">
        <CardHeader>
          <CardTitle>Standalone Map Component Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Navigation Controls */}
          <div>
            <h4 className="font-medium mb-2">Navigation</h4>
            <div className="flex flex-wrap gap-2">
              <Button onClick={navigateToNewYork} variant="outline">
                Go to New York
              </Button>
              <Button onClick={navigateToLondon} variant="outline">
                Go to London
              </Button>
              <Button onClick={navigateToTokyo} variant="outline">
                Go to Tokyo
              </Button>
              <Button 
                onClick={() => setShowInternalSearch(!showInternalSearch)}
                variant="outline"
              >
                {showInternalSearch ? 'Hide' : 'Show'} Internal Search
              </Button>
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div>
            <h4 className="font-medium mb-2">Export Options</h4>
            <div className="flex gap-2">
              <Button onClick={handleDownloadGeoJSON} variant="default">
                Download GeoJSON ({annotations.length} annotations)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Azure SQL Storage */}
          <div>
            <h4 className="font-medium mb-2">Azure SQL Storage</h4>
            <div className="space-y-2">
              <Input
                placeholder="Azure SQL Connection String"
                value={azureConnectionString}
                onChange={(e) => setAzureConnectionString(e.target.value)}
                type="password"
              />
              <Input
                placeholder="Record Name (optional)"
                value={recordName}
                onChange={(e) => setRecordName(e.target.value)}
              />
              <Button 
                onClick={handleStoreToAzureSQL}
                disabled={isStoringToAzure || !azureConnectionString.trim()}
                variant="default"
              >
                {isStoringToAzure ? 'Storing...' : 'Store to Azure SQL'}
              </Button>
            </div>
          </div>
          
          {currentLocation && (
            <div className="text-sm text-muted-foreground pt-2 border-t">
              Current: {currentLocation.searchString || 'Unknown location'} 
              ({currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)})
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Component */}
      <div className="flex-1 m-4 mt-2">
        <StandaloneMapComponent
          externalLocation={externalLocation}
          showInternalSearch={showInternalSearch}
          onLocationChange={handleLocationChange}
          onAnnotationsChange={handleAnnotationsChange}
          theme="light"
          className="border rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default StandaloneMapExample;
