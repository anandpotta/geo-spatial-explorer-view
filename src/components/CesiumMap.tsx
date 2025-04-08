
import { useEffect, useRef } from 'react';
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

  // Initialize Cesium viewer
  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Configure Cesium to use local assets
    window.CESIUM_BASE_URL = '/';

    // Create the Cesium viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      terrainProvider: Cesium.createWorldTerrain(),
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
    
    // Clean up on unmount
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, [onMapReady]);

  // Handle location changes
  useEffect(() => {
    if (!viewerRef.current || !selectedLocation) return;
    
    const viewer = viewerRef.current;
    
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
      complete: onFlyComplete
    });
    
  }, [selectedLocation, onFlyComplete]);
  
  return <div ref={cesiumContainer} className="w-full h-full" />;
};

export default CesiumMap;
