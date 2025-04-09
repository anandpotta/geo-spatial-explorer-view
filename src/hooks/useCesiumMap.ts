
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { toast } from '@/components/ui/use-toast';

// Do not set the Ion token globally here, we'll handle it differently
// to avoid the 401 errors

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

      // Create the Cesium viewer with basic settings - WITH FALLBACK OPTIONS
      // This ensures we get at least a basic globe without requiring Ion services
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
        requestRenderMode: false, // Render continuously
        maximumRenderTimeChange: Infinity, // Force rendering
      });
      
      // Create basic globe appearance
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.skyBox.show = true;
      
      // Always start with a view from deep space
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 40000000.0),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0
        }
      });
      
      // Immediately add OpenStreetMap as the base layer
      // This ensures we have at least some imagery without needing Ion
      const osmProvider = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      });
      viewer.imageryLayers.addImageryProvider(osmProvider);
      console.log("Added OpenStreetMap as base imagery layer");
      
      // Make sure the scene is properly rendered at startup
      viewer.scene.requestRender();
      
      // Force a full render cycle immediately
      setTimeout(() => {
        viewer.scene.requestRender();
      }, 100);
      
      // Save the viewer reference
      viewerRef.current = viewer;
      
      console.log("Cesium map initialized with space view and OpenStreetMap imagery");
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
