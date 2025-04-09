
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';

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
      const createTerrainProvider = async () => {
        try {
          const terrainProvider = await Cesium.createWorldTerrainAsync();
          
          const viewer = new Cesium.Viewer(cesiumContainer.current!, {
            terrainProvider: terrainProvider,
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
          
          // Enable lighting based on sun/moon positions
          viewer.scene.globe.enableLighting = true;
          viewer.scene.globe.depthTestAgainstTerrain = true;
          
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
          
          console.log("Cesium map initialized with space view");
          setIsInitialized(true);
          setIsLoadingMap(false);
          
          if (onMapReady) {
            onMapReady();
          }
        } catch (error) {
          console.error('Error creating terrain provider:', error);
          
          // Fallback to a basic viewer without terrain if the terrain provider fails
          console.log('Falling back to basic Cesium viewer without terrain');
          
          const basicViewer = new Cesium.Viewer(cesiumContainer.current!, {
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
          });
          
          // Set space view for the basic viewer
          basicViewer.scene.skyAtmosphere.show = true;
          basicViewer.scene.skyBox.show = true;
          
          // Set the view to deep space
          basicViewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 40000000.0),
            orientation: {
              heading: 0.0,
              pitch: -Cesium.Math.PI_OVER_TWO,
              roll: 0.0
            }
          });
          
          basicViewer.scene.requestRender();
          
          // Save reference to fallback viewer
          viewerRef.current = basicViewer;
          
          setIsInitialized(true);
          setIsLoadingMap(false);
          
          if (onMapReady) {
            onMapReady();
          }
        }
      };
      
      createTerrainProvider().catch(error => {
        console.error('Failed to initialize terrain:', error);
        setMapError('Failed to initialize 3D terrain. Please try again later.');
        setIsLoadingMap(false);
      });
      
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
      setMapError('Failed to initialize 3D globe. Please try again later.');
      setIsLoadingMap(false);
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
