
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { toast } from '@/components/ui/use-toast';

// Initialize the Cesium Ion access token
Cesium.Ion.defaultAccessToken = API_CONFIG.CESIUM_ION_TOKEN;

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
      console.log("Initializing Cesium viewer...");
      
      // Configure Cesium to use local assets
      (window as any).CESIUM_BASE_URL = '/';

      // Create the Cesium viewer with basic settings
      // We'll create a simple viewer without terrain first as the main approach
      const viewer = new Cesium.Viewer(cesiumContainer.current!, {
        geocoder: false,
        homeButton: false,
        sceneModePicker: true,
        baseLayerPicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        // Remove the imageryProvider property as it's not supported in the type
        terrainProvider: undefined, // Use undefined for terrainProvider
        requestRenderMode: false, // Render continuously
        maximumRenderTimeChange: Infinity, // Force rendering
      });
      
      // Enable lighting based on sun/moon positions
      viewer.scene.globe.enableLighting = true;
      
      // Show the earth in space
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Always start with a view from deep space
      // Use a much higher altitude (40,000,000 meters) for a true space view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 40000000.0),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0
        }
      });
      
      // Make sure the scene is properly rendered at startup
      viewer.scene.requestRender();
      
      // Add a basic stars background
      viewer.scene.skyBox.show = true;
      
      // Force a full render cycle immediately
      setTimeout(() => {
        viewer.scene.requestRender();
      }, 100);
      
      // Save the viewer reference
      viewerRef.current = viewer;
      
      // Try to load Cesium World Terrain asynchronously
      // If it fails, we'll still have a basic viewer
      Cesium.createWorldTerrainAsync()
        .then(terrainProvider => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.terrainProvider = terrainProvider;
            viewerRef.current.scene.globe.depthTestAgainstTerrain = true;
            console.log("Terrain loaded successfully");
          }
        })
        .catch(error => {
          console.warn("Terrain loading failed, using basic globe instead:", error);
          // No need to handle this error specifically - we already have a basic viewer
        });
      
      // Try to load Cesium World Imagery asynchronously
      Cesium.createWorldImageryAsync()
        .then(imageryProvider => {
          if (viewerRef.current && !viewerRef.current.isDestroyed()) {
            viewerRef.current.imageryLayers.addImageryProvider(imageryProvider);
            console.log("Imagery loaded successfully");
          }
        })
        .catch(error => {
          console.warn("Imagery loading failed, using basic globe instead:", error);
          // No need to handle this error specifically - we already have a basic viewer
        });
      
      console.log("Cesium map initialized with space view");
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
