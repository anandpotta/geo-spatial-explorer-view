
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
      
      // CRITICAL: Completely block all network requests from Cesium
      // Override the Resource constructor to prevent network requests
      const originalResource = Cesium.Resource;
      
      try {
        // Create a mock Resource class that prevents all network requests
        const MockResource: any = function(options: any) {
          this._url = '';
          this.request = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
          this.fetchImage = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
          this.fetchJson = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
          this.fetchXML = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
          this.fetchText = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
          this.fetchArrayBuffer = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
          this.fetchBlob = function() {
            return Promise.reject(new Error('Network requests are disabled'));
          };
        };
        
        MockResource.prototype.clone = function() {
          return new MockResource({});
        };
        
        // Temporarily replace Resource with our mock version
        // @ts-ignore - This is a deliberate override
        Cesium.Resource = MockResource;
      } catch (e) {
        console.log('Could not override Resource class, continuing anyway');
      }
      
      // CRITICAL: Disable Ion and all network requests
      Cesium.Ion.defaultAccessToken = '';
      
      // Create an empty imagery provider
      const emptyImageryProvider = undefined;
      
      // Create simple terrain provider
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
        imageryProvider: emptyImageryProvider,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        targetFrameRate: 10, // Lower frame rate to reduce resources
        shadows: false
      };
      
      // Create viewer with minimal options
      const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);
      
      // CRITICAL: Immediately remove ALL imagery layers
      viewer.imageryLayers.removeAll();
      
      // Disable all automatic asset loading
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showWaterEffect = false;
      
      // Blue globe appearance
      viewer.scene.globe.baseColor = Cesium.Color.BLUE.withAlpha(0.7);
      
      // Disable atmospheric features
      viewer.scene.skyAtmosphere.show = false;
      viewer.scene.fog.enabled = false;
      viewer.scene.moon.show = false;
      viewer.scene.sun.show = false;
      viewer.scene.skyBox.show = false;
      
      // Disable terrain
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Handle internal properties safely using type casting and try/catch
      try {
        // Use type assertion to access private properties
        const globe = viewer.scene.globe as any;
        if (globe._surface && globe._surface._tileProvider && globe._surface._tileProvider._debug) {
          globe._surface._tileProvider._debug.wireframe = true;
        }
      } catch (e) {
        console.log('Could not access internal globe properties, continuing anyway');
      }
      
      // Disable request scheduler if it exists
      try {
        if ((Cesium as any).RequestScheduler) {
          (Cesium as any).RequestScheduler.requestsByServer = {};
          (Cesium as any).RequestScheduler.maximumRequestsPerServer = 0;
        }
      } catch (e) {
        console.log('Could not disable request scheduler, continuing anyway');
      }
      
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
      
      // Reset the Resource class back to original
      try {
        // @ts-ignore - This is a deliberate override
        Cesium.Resource = originalResource;
      } catch (e) {
        console.log('Could not restore Resource class, continuing anyway');
      }
      
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
