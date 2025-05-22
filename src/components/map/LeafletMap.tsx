
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.css';
import 'leaflet-draw'; // Ensure leaflet-draw is imported
import { Location } from '@/utils/geo-utils';
import { useDrawingTools } from '@/hooks/useDrawingTools';

interface LeafletMapProps {
  selectedLocation: Location | undefined;
  onMapReady: (map: any) => void;
  activeTool: string | null;
  onClearAll: () => void;
  isMapReady: boolean;
}

const LeafletMap = ({
  selectedLocation,
  onMapReady,
  activeTool,
  onClearAll,
  isMapReady
}: LeafletMapProps) => {
  const [mapKey] = useState<string>(`leaflet-map-${Date.now()}`);
  const [isMapInit, setIsMapInit] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);
  const initCompletedRef = useRef<boolean>(false);
  const { initDrawingControls } = useDrawingTools(mapRef, drawnItemsRef, activeTool);
  
  // Clean up any orphaned Leaflet container classes
  const cleanupOrphanedMaps = useCallback(() => {
    const orphanedContainers = document.querySelectorAll('.leaflet-container');
    orphanedContainers.forEach(container => {
      if (!document.body.contains(container.parentElement)) {
        container.remove();
      }
    });
  }, []);
  
  // Initialize the map
  useEffect(() => {
    // Force clear any orphaned map instances
    cleanupOrphanedMaps();

    if (mapRef.current) {
      console.log("LeafletMap: Map already initialized, skipping");
      return;
    }

    const position: [number, number] = selectedLocation 
      ? [selectedLocation.y, selectedLocation.x]
      : [0, 0];
    
    const zoom = selectedLocation ? 14 : 2;
    
    console.log(`LeafletMap: Initializing map at position [${position[0]}, ${position[1]}], zoom ${zoom}`);
    
    // Wait for DOM to be ready
    setTimeout(() => {
      if (containerRef.current && !mapRef.current) {
        console.log("LeafletMap: Container is ready, creating map");
        
        try {
          // Create new map instance
          const map = L.map(containerRef.current, {
            center: position,
            zoom: zoom,
            zoomControl: false,
            attributionControl: false
          });
          
          mapRef.current = map;
          
          // Add tile layer with full opacity
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            opacity: 1.0, // Ensure full visibility
          }).addTo(map);
          
          // Create the feature group for drawing
          const featureGroup = new L.FeatureGroup();
          map.addLayer(featureGroup);
          drawnItemsRef.current = featureGroup;
          
          // Add attribution control
          L.control.attribution({ position: 'bottomright' }).addTo(map);

          // Force invalidate size after a short delay
          setTimeout(() => {
            if (map) {
              console.log("LeafletMap: Forcing map invalidation");
              map.invalidateSize(true);
            }
            
            // Notify that map is ready
            setIsMapInit(true);
            
            if (onMapReady) {
              console.log("LeafletMap: Map is ready, calling onMapReady");
              onMapReady(map);
            }
            
            // Initialize drawing controls after map is ready
            if (drawnItemsRef.current) {
              setTimeout(() => {
                if (!initCompletedRef.current) {
                  initDrawingControls(map, featureGroup);
                  initCompletedRef.current = true;
                }
              }, 300);
            }
            
            // Force another invalidation after a longer delay for stability
            setTimeout(() => {
              if (map) {
                map.invalidateSize(true);
              }
            }, 500);
          }, 200);
        } catch (error) {
          console.error("LeafletMap: Error initializing map:", error);
        }
      } else {
        console.error("LeafletMap: Container ref is null or map already initialized");
      }
    }, 100);

    return () => {
      // Cleanup
      if (mapRef.current) {
        console.log("LeafletMap: Removing map instance");
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error("Error removing map:", e);
        }
        mapRef.current = null;
        initCompletedRef.current = false;
      }
    };
  }, [selectedLocation, cleanupOrphanedMaps, onMapReady]);

  // Handle location changes
  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      console.log(`LeafletMap: Setting position to [${selectedLocation.y}, ${selectedLocation.x}] for ${selectedLocation.label}`);
      
      try {
        // Set view with animation
        mapRef.current.setView(
          [selectedLocation.y, selectedLocation.x], 
          14, // Higher zoom level for better detail
          { 
            animate: true, 
            duration: 1.0 // Faster animation
          }
        );
        
        // Add a marker for the location if it doesn't exist
        if (!locationMarkerRef.current) {
          locationMarkerRef.current = L.marker([selectedLocation.y, selectedLocation.x])
            .addTo(mapRef.current)
            .bindPopup(selectedLocation.label)
            .openPopup();
        } else {
          // Update existing marker
          locationMarkerRef.current.setLatLng([selectedLocation.y, selectedLocation.x])
            .bindPopup(selectedLocation.label)
            .openPopup();
        }
        
        // Force refresh map after position change
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize(true);
          }
        }, 300);
      } catch (err) {
        console.error("Error updating map position:", err);
      }
    }
  }, [selectedLocation]);

  // Clear all drawings
  useEffect(() => {
    if (onClearAll && mapRef.current && drawnItemsRef.current) {
      const handleClearAll = () => {
        console.log("LeafletMap: Clearing all drawings");
        drawnItemsRef.current?.clearLayers();
      };
      
      window.addEventListener('clearAllDrawings', handleClearAll);
      
      return () => {
        window.removeEventListener('clearAllDrawings', handleClearAll);
      };
    }
  }, [onClearAll]);
  
  // Update drawing controls when activeTool changes
  useEffect(() => {
    if (mapRef.current && drawnItemsRef.current && initCompletedRef.current) {
      console.log(`LeafletMap: Active tool changed to ${activeTool}`);
      initDrawingControls(mapRef.current, drawnItemsRef.current);
    }
  }, [activeTool, initDrawingControls]);
  
  return (
    <div className="w-full h-full" style={{ opacity: 1, zIndex: 5 }}>
      <div 
        ref={containerRef} 
        className="w-full h-full" 
        data-map-key={mapKey}
        style={{ opacity: 1, visibility: 'visible' }}
      />
    </div>
  );
};

export default LeafletMap;
