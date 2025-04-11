
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { toast } from '@/components/ui/use-toast';

interface UseCesiumMapResult {
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  entityRef: React.MutableRefObject<Cesium.Entity | null>;
  isLoadingMap: boolean;
  mapError: string | null;
  isInitialized: boolean;
}

export const useCesiumMap = (
  cesiumContainer: React.RefObject<HTMLDivElement>,
  onMapReady?: () => void
): UseCesiumMapResult => {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Cesium viewer
  useEffect(() => {
    if (!cesiumContainer.current) return;

    // Clean up any previous viewer
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      console.log("Destroying previous Cesium viewer");
      viewerRef.current.destroy();
      viewerRef.current = null;
    }

    try {
      console.log("Initializing Cesium viewer in offline mode...");
      
      // Completely disable Ion - critical to prevent authentication errors
      Cesium.Ion.defaultAccessToken = '';
      
      // Force disable all network requests for Ion services
      const baseUrl = window.location.origin;
      (window as any).CESIUM_BASE_URL = baseUrl;
      
      // Create a custom terrain provider that's just a simple ellipsoid (no network requests)
      const terrainProvider = new Cesium.EllipsoidTerrainProvider();
      
      // Create the viewer without any imagery or external services
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        terrainProvider: terrainProvider,
        // Fix: Remove imageryProvider option as it's not in the type definition
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        creditContainer: document.createElement('div'), // Hide credits
        contextOptions: {
          webgl: {
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            failIfMajorPerformanceCaveat: false
          }
        }
      });
      
      // Remove any default imagery layer that might have been created
      viewer.imageryLayers.removeAll();
      
      // Set up simple blue globe appearance
      viewer.scene.globe.baseColor = Cesium.Color.BLUE.withAlpha(0.7);
      
      // Disable atmosphere to avoid potential network requests for atmosphere assets
      viewer.scene.skyAtmosphere.show = false;
      
      // Disable fog, sun, moon, stars
      viewer.scene.fog.enabled = false;
      viewer.scene.sun.show = false;
      viewer.scene.moon.show = false;
      
      // Make sure the skybox is disabled to avoid image loading errors
      viewer.scene.skyBox.show = false;
      
      // Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      
      // Set initial view 
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000.0),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0
        }
      });
      
      // Force immediate rendering
      viewer.scene.requestRender();
      
      // Save the viewer reference
      viewerRef.current = viewer;
      
      console.log("Cesium map initialized in offline mode");
      setIsInitialized(true);
      setIsLoadingMap(false);
      
      if (onMapReady) {
        onMapReady();
      }
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
      setMapError('Failed to initialize 3D globe. Please try again later.');
      setIsLoadingMap(false);
      
      // Show error toast
      toast({
        title: "Map Error",
        description: "Failed to initialize 3D globe. Falling back to 2D view.",
        variant: "destructive"
      });
    }
    
    // Clean up on unmount
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        console.log("Destroying Cesium viewer on unmount");
        viewerRef.current.destroy();
      }
    };
  }, [cesiumContainer, onMapReady]);

  return {
    viewerRef,
    entityRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
