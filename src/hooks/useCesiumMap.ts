
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
      
      // CRITICAL: Disable Ion and all network requests
      // This must happen BEFORE creating any Cesium objects
      Cesium.Ion.defaultAccessToken = '';
      
      // Override default resource fetching behavior
      // @ts-ignore - Access private API to completely disable network
      Cesium.Resource.supportsImageBitmapOptions = false;
      
      // @ts-ignore - Disable asset loading
      Cesium._deprecationWarning = function() {};
      
      // Disable automatic imagery provider creation
      // @ts-ignore - Access internal property
      Cesium.createWorldImagery = function() {
        return undefined;
      };
      
      // @ts-ignore - Access internal property 
      Cesium.createWorldTerrain = function() {
        return new Cesium.EllipsoidTerrainProvider();
      };
      
      // Create basic terrain provider that doesn't need network
      const terrainProvider = new Cesium.EllipsoidTerrainProvider();
      
      // Create viewer with absolutely minimal configuration
      const viewerOptions = {
        terrainProvider: terrainProvider,
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
        requestRenderMode: true, // Only render when needed
        maximumRenderTimeChange: Infinity, // Don't render based on time change
        shadows: false
      };
      
      // Create viewer with minimal options
      const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);
      
      // CRITICAL: Immediately remove ALL imagery layers to prevent any network requests
      viewer.imageryLayers.removeAll();
      
      // Disable all automatic asset loading
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showWaterEffect = false;
      
      // Blue globe appearance
      viewer.scene.globe.baseColor = Cesium.Color.BLUE.withAlpha(0.7);
      
      // Disable all features that might trigger network requests
      viewer.scene.skyAtmosphere.show = false;
      viewer.scene.fog.enabled = false;
      viewer.scene.moon.show = false;
      viewer.scene.sun.show = false;
      viewer.scene.skyBox.show = false;
      
      // Disable terrain
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Disable tile loading verification
      // @ts-ignore - Access private API
      if (viewer.scene.globe._surface) {
        // @ts-ignore - Access private API
        viewer.scene.globe._surface._tileProvider._debug.wireframe = true;
      }
      
      // Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      
      // More aggressive disabling of network requests
      // @ts-ignore - Access internal API
      Cesium.RequestScheduler.maximumRequestsPerServer = 0;
      // @ts-ignore - Access internal API
      Cesium.RequestScheduler.throttleRequests = true;
      
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
