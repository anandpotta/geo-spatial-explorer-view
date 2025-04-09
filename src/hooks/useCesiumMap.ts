
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
      console.log("Initializing Cesium viewer with pure CesiumJS...");
      
      // Configure Cesium to use local assets
      (window as any).CESIUM_BASE_URL = '/';
      
      // Make sure Ion is completely disabled
      Cesium.Ion.defaultAccessToken = '';
      
      // Create the imagery provider directly
      const osmProvider = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      });
      
      // Create the Cesium viewer with basic settings - WITHOUT using Ion
      const viewer = new Cesium.Viewer(cesiumContainer.current, {
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
        requestRenderMode: false,
        maximumRenderTimeChange: Infinity,
        terrain: undefined,
        skyBox: undefined,
        skyAtmosphere: new Cesium.SkyAtmosphere(),
      });
      
      // Set the imagery provider after viewer creation
      viewer.imageryLayers.addImageryProvider(osmProvider);
      
      // Disable depth testing for a solid color background
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Create basic globe appearance with a simpler approach
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Set the globe base color for when imagery is not loaded
      viewer.scene.globe.baseColor = Cesium.Color.BLUE;
      
      // Always start with a view from deep space
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
