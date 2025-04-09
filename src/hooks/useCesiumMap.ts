
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
      
      // Configure Cesium to use local assets
      (window as any).CESIUM_BASE_URL = '/';
      
      // Force disable Ion completely
      Cesium.Ion.defaultAccessToken = '';
      
      // Disable all credit display to prevent any network requests
      Cesium.CreditDisplay.cesiumCredit = new Cesium.Credit('');
      
      // Create the Cesium viewer with minimal settings to avoid network requests
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        creditContainer: document.createElement('div'), // Hide credits
        // Remove the incorrect imageryProvider property
        requestRenderMode: true,
        targetFrameRate: 30,
      });
      
      // Disable all imagery provider to prevent network requests
      viewer.imageryLayers.removeAll();
      
      // Disable all features that might cause network requests
      viewer.scene.globe.enableLighting = false;
      viewer.scene.skyAtmosphere.show = false;
      viewer.scene.fog.enabled = false;
      viewer.scene.sun.show = false;
      viewer.scene.moon.show = false;
      viewer.scene.skyBox.show = false;
      
      // Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.globe.baseColor = Cesium.Color.DARKBLUE;
      
      // Set up a simple view
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
