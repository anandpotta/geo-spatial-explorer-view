
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
      
      // We need to disable the whole system before Cesium even tries to initialize
      // 1. Disable Ion completely
      Cesium.Ion.defaultAccessToken = '';
      
      // 2. Use our own patching mechanism to prevent network requests
      patchCesiumToPreventNetworkRequests();
      
      // 3. Create viewer with absolutely minimal configuration
      const viewerOptions: Cesium.Viewer.ConstructorOptions = {
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
        // Remove imageryProvider property as it doesn't exist in ConstructorOptions
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        targetFrameRate: 10, // Lower frame rate to reduce resources
        shadows: false,
        skyBox: false as any, // Disable skybox
        skyAtmosphere: false as any, // Disable atmosphere
        globe: new Cesium.Globe(Cesium.Ellipsoid.WGS84),
        scene3DOnly: true, // Optimize for 3D only
        // Critical: Explicitly create empty imagery layer collection
        imageryLayers: new Cesium.ImageryLayerCollection()
      };
      
      // 4. Create viewer with minimal options
      const viewer = new Cesium.Viewer(cesiumContainer.current, viewerOptions);
      
      // 5. Clean up any auto-created layers
      if (viewer.imageryLayers) {
        viewer.imageryLayers.removeAll();
      }
      
      // 6. Configure globe appearance 
      const globe = viewer.scene.globe;
      
      // Disable all globe features that might request data
      globe.enableLighting = false;
      globe.showWaterEffect = false;
      globe.showGroundAtmosphere = false;
      globe.baseColor = Cesium.Color.BLUE.withAlpha(0.7); // Simple blue globe
      
      // 7. Disable all automatic asset loading features
      viewer.scene.skyAtmosphere.show = false;
      viewer.scene.fog.enabled = false;
      viewer.scene.moon.show = false;
      viewer.scene.sun.show = false;
      
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = false;
      }
      
      // 8. Disable terrain
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // 9. Use type assertion to access private properties safely
      try {
        // Access private properties using type assertion
        const globeAny = globe as any;
        if (globeAny._surface && globeAny._surface._tileProvider) {
          if (globeAny._surface._tileProvider._debug) {
            globeAny._surface._tileProvider._debug.wireframe = true;
          }
        }
      } catch (e) {
        console.log('Could not access internal globe properties, continuing anyway');
      }
      
      // 10. Set background color
      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      
      // 11. Set initial view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000.0),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO,
          roll: 0.0
        }
      });
      
      // 12. Force immediate rendering
      viewer.scene.requestRender();
      
      // 13. Save the viewer reference
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

// Helper function to patch Cesium methods that make network requests
function patchCesiumToPreventNetworkRequests() {
  try {
    // 1. Patch Resource to prevent network requests
    if (Cesium.Resource) {
      const originalFetch = Cesium.Resource.prototype.fetch;
      Cesium.Resource.prototype.fetch = function(...args: any[]) {
        console.log('Blocked network request to:', this._url);
        return Promise.reject(new Error('Network requests are disabled'));
      };
      
      const originalFetchImage = Cesium.Resource.prototype.fetchImage;
      Cesium.Resource.prototype.fetchImage = function(...args: any[]) {
        console.log('Blocked image request to:', this._url);
        return Promise.reject(new Error('Network requests are disabled'));
      };
      
      const originalFetchJson = Cesium.Resource.prototype.fetchJson;
      Cesium.Resource.prototype.fetchJson = function(...args: any[]) {
        console.log('Blocked JSON request to:', this._url);
        return Promise.reject(new Error('Network requests are disabled'));
      };
      
      const originalFetchXML = Cesium.Resource.prototype.fetchXML;
      Cesium.Resource.prototype.fetchXML = function(...args: any[]) {
        console.log('Blocked XML request to:', this._url);
        return Promise.reject(new Error('Network requests are disabled'));
      };
      
      const originalFetchText = Cesium.Resource.prototype.fetchText;
      Cesium.Resource.prototype.fetchText = function(...args: any[]) {
        console.log('Blocked text request to:', this._url);
        return Promise.reject(new Error('Network requests are disabled'));
      };
    }
    
    // 2. Disable RequestScheduler
    if ((Cesium as any).RequestScheduler) {
      try {
        const scheduler = (Cesium as any).RequestScheduler;
        if (scheduler.maximumRequestsPerServer) {
          scheduler.maximumRequestsPerServer = 0;
        }
        if (scheduler.requestsByServer) {
          scheduler.requestsByServer = {};
        }
      } catch (e) {
        console.log('Could not disable RequestScheduler, continuing anyway');
      }
    }
    
    // 3. Patch IonImageryProvider and ImageryLayer related functionality
    try {
      // Block IonImageryProvider
      if (Cesium.IonImageryProvider) {
        Cesium.IonImageryProvider.fromAssetId = function(...args: any[]) {
          console.log('Blocked IonImageryProvider.fromAssetId');
          return Promise.reject(new Error('Network requests are disabled'));
        };
      }
      
      // Patch createWorldImageryAsync by monkey-patching the prototype before it's called
      if (Cesium.ImageryLayer) {
        // Instead of modifying the read-only function, intercept its usage in ImageryLayer.fromWorldImagery
        const original = Cesium.ImageryLayer.fromWorldImagery;
        Object.defineProperty(Cesium.ImageryLayer, 'fromWorldImagery', {
          value: function() {
            console.log('Blocked ImageryLayer.fromWorldImagery');
            return null;
          },
          writable: true
        });
      }
      
    } catch (e) {
      console.log('Could not patch imagery providers, continuing anyway');
    }
    
    // 4. Block terrain-related functionality - using a different approach for read-only properties
    try {
      if (Cesium.CesiumTerrainProvider) {
        Cesium.CesiumTerrainProvider.fromUrl = function(...args: any[]) {
          console.log('Blocked CesiumTerrainProvider.fromUrl');
          return Promise.reject(new Error('Network requests are disabled'));
        };
      }
      
      // Intercept ApproximateTerrainHeights.initialize which uses createWorldTerrainAsync
      if ((Cesium as any).ApproximateTerrainHeights) {
        const ath = (Cesium as any).ApproximateTerrainHeights;
        ath.initialize = function() {
          console.log('Blocked ApproximateTerrainHeights.initialize');
          return Promise.resolve();
        };
        
        // Pre-populate with dummy values to prevent further initialization attempts
        ath._initialized = true;
        ath._terrainHeights = {
          minimumTerrainHeight: -100,
          maximumTerrainHeight: 100
        };
      }
    } catch (e) {
      console.log('Could not patch terrain providers, continuing anyway');
    }
    
    console.log('Successfully patched Cesium to prevent network requests');
  } catch (e) {
    console.error('Error patching Cesium:', e);
  }
}
