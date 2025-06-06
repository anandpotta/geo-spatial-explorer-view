import React, { useRef, useState, useEffect, useCallback } from 'react';
import { EnhancedLocation } from '@/utils/enhanced-geo-utils';
import { useToast } from '@/components/ui/use-toast';
import LocationSearch from '@/components/LocationSearch';
import LeafletMap from '@/components/map/LeafletMap';
import { toast } from 'sonner';

export interface StandaloneMapProps {
  // External location input
  externalLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
    label?: string;
  };
  
  // Component configuration
  showInternalSearch?: boolean;
  width?: string | number;
  height?: string | number;
  className?: string;
  
  // Callbacks
  onLocationChange?: (location: { latitude: number; longitude: number; searchString?: string }) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onGeoJSONGenerated?: (geojson: any) => void;
  
  // Styling
  theme?: 'light' | 'dark';
  
  // Initial map settings
  initialZoom?: number;
  defaultLocation?: {
    latitude: number;
    longitude: number;
  };
}

// Change from FC to regular function component to fix JSX type issues
function StandaloneMapComponent({
  externalLocation,
  showInternalSearch = true,
  width = '100%',
  height = '100vh',
  className = '',
  onLocationChange,
  onAnnotationsChange,
  onGeoJSONGenerated,
  theme = 'light',
  initialZoom = 15,
  defaultLocation = { latitude: 40.7128, longitude: -74.0060 } // NYC default
}: StandaloneMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<EnhancedLocation | undefined>();
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<any>(null);

  // Convert external location to internal format
  useEffect(() => {
    if (externalLocation) {
      const location: EnhancedLocation = {
        id: `external-${externalLocation.latitude}-${externalLocation.longitude}`,
        label: externalLocation.label || externalLocation.searchString || `Location at ${externalLocation.latitude.toFixed(4)}, ${externalLocation.longitude.toFixed(4)}`,
        x: externalLocation.longitude,
        y: externalLocation.latitude,
        searchString: externalLocation.searchString // Store search string for GeoJSON export
      };
      
      setSelectedLocation(location);
      
      // Notify parent of location change
      if (onLocationChange) {
        onLocationChange({
          latitude: externalLocation.latitude,
          longitude: externalLocation.longitude,
          searchString: externalLocation.searchString
        });
      }
      
      toast.success(`Navigating to ${location.label}`);
    }
  }, [externalLocation, onLocationChange]);

  // Handle internal location selection
  const handleInternalLocationSelect = useCallback((location: any) => {
    console.log('Internal location selected:', location);
    
    // Convert to EnhancedLocation format
    const enhancedLocation: EnhancedLocation = {
      id: location.id,
      label: location.label,
      x: location.x,
      y: location.y,
      searchString: location.label,
      timestamp: new Date().toISOString(),
      source: 'internal'
    };
    
    setSelectedLocation(enhancedLocation);
    
    // Notify parent of location change
    if (onLocationChange) {
      onLocationChange({
        latitude: location.y,
        longitude: location.x,
        searchString: location.label
      });
    }
    
    toast.success(`Navigating to ${location.label}`);
  }, [onLocationChange]);

  // Handle map ready
  const handleMapReady = useCallback((map: any) => {
    console.log('Standalone map ready');
    mapRef.current = map;
    setIsMapReady(true);
  }, []);

  // Handle clear selected location
  const handleClearSelectedLocation = useCallback(() => {
    setSelectedLocation(undefined);
    
    if (onLocationChange) {
      onLocationChange({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude
      });
    }
  }, [onLocationChange, defaultLocation]);

  // Monitor annotations and notify parent
  useEffect(() => {
    const handleAnnotationsUpdate = () => {
      // Get current annotations from localStorage
      try {
        const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
        const savedDrawings = JSON.parse(localStorage.getItem('savedDrawings') || '[]');
        
        const allAnnotations = [
          ...savedMarkers.map((marker: any) => ({
            type: 'marker',
            ...marker,
            searchLocation: selectedLocation ? {
              latitude: selectedLocation.y,
              longitude: selectedLocation.x,
              searchString: selectedLocation.searchString || selectedLocation.label
            } : null
          })),
          ...savedDrawings.map((drawing: any) => ({
            type: 'drawing',
            ...drawing,
            searchLocation: selectedLocation ? {
              latitude: selectedLocation.y,
              longitude: selectedLocation.x,
              searchString: selectedLocation.searchString || selectedLocation.label
            } : null
          }))
        ];
        
        if (onAnnotationsChange) {
          onAnnotationsChange(allAnnotations);
        }
      } catch (error) {
        console.error('Error reading annotations:', error);
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleAnnotationsUpdate);
    window.addEventListener('markersUpdated', handleAnnotationsUpdate);
    window.addEventListener('drawingCreated', handleAnnotationsUpdate);
    window.addEventListener('drawingDeleted', handleAnnotationsUpdate);

    // Initial load
    handleAnnotationsUpdate();

    return () => {
      window.removeEventListener('storage', handleAnnotationsUpdate);
      window.removeEventListener('markersUpdated', handleAnnotationsUpdate);
      window.removeEventListener('drawingCreated', handleAnnotationsUpdate);
      window.removeEventListener('drawingDeleted', handleAnnotationsUpdate);
    };
  }, [onAnnotationsChange, selectedLocation]);

  const containerStyle: React.CSSProperties = {
    width,
    height,
    position: 'relative',
    overflow: 'hidden'
  };

  // Convert EnhancedLocation back to the format expected by LeafletMap
  const leafletLocation = selectedLocation ? {
    id: selectedLocation.id,
    label: selectedLocation.label,
    x: selectedLocation.x,
    y: selectedLocation.y,
    raw: selectedLocation.raw
  } : undefined;

  return (
    <div 
      className={`standalone-map-container ${theme} ${className}`}
      style={containerStyle}
    >
      {/* Internal search - can be hidden */}
      {showInternalSearch && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[10000]" 
          style={{ maxWidth: '400px', width: '90%' }}
        >
          <LocationSearch onLocationSelect={handleInternalLocationSelect} />
        </div>
      )}
      
      {/* Main map component */}
      <LeafletMap
        selectedLocation={leafletLocation}
        onMapReady={handleMapReady}
        onLocationSelect={handleInternalLocationSelect}
        onClearSelectedLocation={handleClearSelectedLocation}
      />
    </div>
  );
}

export { StandaloneMapComponent };
export default StandaloneMapComponent;
