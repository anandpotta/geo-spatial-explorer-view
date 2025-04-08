
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { Location } from '@/utils/geo-utils';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Initialize the Cesium Ion access token
Cesium.Ion.defaultAccessToken = API_CONFIG.CESIUM_ION_TOKEN;

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
}

const CesiumMap = ({ selectedLocation, onMapReady, onFlyComplete }: CesiumMapProps) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  
  // Initialize Cesium viewer
  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Configure Cesium to use local assets
    (window as any).CESIUM_BASE_URL = '/';

    try {
      // Create the Cesium viewer with basic settings
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        // Use async terrain provider and handle the promise
        terrainProvider: undefined, // Initially set to undefined
        geocoder: false,
        homeButton: false,
        sceneModePicker: true,
        baseLayerPicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
      });

      // Add terrain asynchronously
      Cesium.createWorldTerrainAsync({
        requestVertexNormals: true,
        requestWaterMask: true
      }).then(terrain => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.terrainProvider = terrain;
        }
      }).catch(error => {
        console.error('Error loading terrain:', error);
      });
      
      // Enable lighting based on sun/moon positions
      viewer.scene.globe.enableLighting = true;
      
      // Show the earth in space
      viewer.scene.skyAtmosphere.show = true;
      
      // Set the initial view to show the whole Earth
      viewer.camera.flyHome(0);
      
      // Save the viewer reference
      viewerRef.current = viewer;
      
      if (onMapReady) {
        onMapReady();
      }
      
      setIsLoadingMap(false);
      
      // Clean up on unmount
      return () => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.destroy();
        }
      };
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
      setMapError('Failed to initialize 3D globe. Please try again later.');
      setIsLoadingMap(false);
    }
  }, [onMapReady]);

  // Handle location changes
  useEffect(() => {
    if (!viewerRef.current || !selectedLocation || mapError || isFlying) return;
    
    const viewer = viewerRef.current;
    setIsFlying(true);
    console.log('Flying to location in Cesium:', selectedLocation);
    
    // Remove old entity if it exists
    if (entityRef.current) {
      viewer.entities.remove(entityRef.current);
      entityRef.current = null;
    }
    
    // Create a new entity at the selected location
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.x, selectedLocation.y),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: selectedLocation.label,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      }
    });
    
    entityRef.current = entity;
    
    // Fly to the location
    viewer.flyTo(entity, {
      duration: 3,
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0), // heading
        Cesium.Math.toRadians(-45), // pitch
        10000 // range in meters
      ),
    }).then(() => {
      setIsFlying(false);
      if (onFlyComplete) {
        console.log('Fly complete in Cesium, triggering callback');
        onFlyComplete();
      }
    }).catch(error => {
      console.error('Error flying to location:', error);
      setIsFlying(false);
      // Still trigger fly complete to switch to 2D map as fallback
      if (onFlyComplete) {
        onFlyComplete();
      }
    });
    
  }, [selectedLocation, onFlyComplete, mapError, isFlying]);
  
  // If there's an error loading the map, display an error message
  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <h3 className="text-xl font-bold mb-2">Cesium Map Error</h3>
          <p>{mapError}</p>
          <p className="text-sm mt-4">Falling back to 2D map view...</p>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingMap) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <h3 className="text-xl font-bold mb-2">Loading 3D Globe</h3>
          <p>Please wait while we initialize the map...</p>
        </div>
      </div>
    );
  }
  
  return <div ref={cesiumContainer} className="w-full h-full" />;
};

export default CesiumMap;
