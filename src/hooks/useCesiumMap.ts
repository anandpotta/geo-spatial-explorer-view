
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

      // Create the Cesium viewer with basic settings - WITHOUT requiring terrain or imagery
      // This ensures we get at least a basic globe even if token is invalid
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
        terrainProvider: undefined, // Start with default ellipsoid terrain
        requestRenderMode: false, // Render continuously
        maximumRenderTimeChange: Infinity, // Force rendering
      });
      
      // Create basic globe appearance regardless of Ion token status
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
      
      // Make sure the scene is properly rendered at startup
      viewer.scene.requestRender();
      
      // Force a full render cycle immediately
      setTimeout(() => {
        viewer.scene.requestRender();
      }, 100);
      
      // Save the viewer reference
      viewerRef.current = viewer;
      
      // Try to load Cesium World Terrain asynchronously
      // If it fails, we'll still have a basic viewer with the default ellipsoid
      if (!API_CONFIG.USE_ION_FALLBACK) {
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
            // Already using basic globe, so no need to handle this error specially
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
            
            // Add OpenStreetMap as fallback if Cesium imagery fails
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
              const osmProvider = new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/'
              });
              viewerRef.current.imageryLayers.addImageryProvider(osmProvider);
              console.log("Added OpenStreetMap as fallback imagery");
            }
          });
      } else {
        // When using fallback mode, directly use OpenStreetMap
        const osmProvider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://a.tile.openstreetmap.org/'
        });
        viewer.imageryLayers.addImageryProvider(osmProvider);
        console.log("Using OpenStreetMap imagery (fallback mode)");
      }
      
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
