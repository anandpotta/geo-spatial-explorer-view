
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { API_CONFIG } from '@/config/api-config';
import { Location } from '@/utils/geo-utils';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Initialize the Cesium Ion access token
Cesium.Ion.defaultAccessToken = API_CONFIG.CESIUM_ION_TOKEN;

interface CesiumMapProps {
  selectedLocation?: Location;
  onMapReady?: () => void;
  onFlyComplete?: () => void;
}

const CesiumMap = ({ selectedLocation, onMapReady, onFlyComplete }: CesiumMapProps) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entityRef = useRef<Cesium.Entity | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFlying, setIsFlying] = useState(false);
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
          
          // Start with a clear view of Earth from space - much higher altitude for a true space view
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 30000000.0), // Higher altitude for space view
            orientation: {
              heading: 0.0,
              pitch: -Cesium.Math.PI_OVER_TWO,
              roll: 0.0
            }
          });
          
          // Force a render to ensure the globe appears
          viewer.scene.requestRender();
          
          // Save the viewer reference
          viewerRef.current = viewer;
          
          console.log("Cesium map initialized, triggering onMapReady");
          setIsInitialized(true);
          setIsLoadingMap(false);
          
          if (onMapReady) {
            onMapReady();
          }
        } catch (error) {
          console.error('Error creating terrain provider:', error);
          throw error;
        }
      };
      
      createTerrainProvider().catch(error => {
        console.error('Failed to initialize terrain:', error);
        setMapError('Failed to initialize 3D terrain. Please try again later.');
        setIsLoadingMap(false);
      });
      
      // Clean up on unmount
      return () => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          console.log("Destroying Cesium viewer on unmount");
          viewerRef.current.destroy();
        }
      };
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
      setMapError('Failed to initialize 3D globe. Please try again later.');
      setIsLoadingMap(false);
    }
  }, [onMapReady]);

  // Handle location changes - this effect should run when selectedLocation changes
  useEffect(() => {
    const viewer = viewerRef.current;
    
    if (!viewer || !selectedLocation || mapError || isFlying || !isInitialized) {
      if (!isInitialized && selectedLocation) {
        console.log("Waiting for Cesium to initialize before flying...");
      }
      return;
    }
    
    setIsFlying(true);
    console.log('Flying to location in Cesium:', selectedLocation);
    
    // Remove old entity if it exists
    if (entityRef.current) {
      viewer.entities.remove(entityRef.current);
      entityRef.current = null;
    }
    
    // Create a new entity at the selected location
    const entity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.x, selectedLocation.y),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: selectedLocation.label,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -10)
      }
    });
    
    entityRef.current = entity;
    
    // Create a multi-step flight animation to simulate real navigation from space
    // Step 1: First ensure we're viewing from far space
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(0, 0, 30000000.0), // Very high altitude
      duration: 1.0,
      complete: function() {
        console.log('Starting from space view');
        
        // Step 2: Fly to position above target location but still high up
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            selectedLocation.x,
            selectedLocation.y,
            5000000.0 // High altitude above location
          ),
          duration: 3.0,
          complete: function() {
            console.log('Approaching target from high altitude');
            
            // Step 3: Zoom in closer to the target location
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(
                selectedLocation.x,
                selectedLocation.y,
                100000.0 // Closer view
              ),
              orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45), // Angled view
                roll: 0
              },
              duration: 2.0,
              complete: function() {
                console.log('Getting closer to target');
                
                // Step 4: Final approach - close aerial view
                viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(
                    selectedLocation.x,
                    selectedLocation.y,
                    1000 // Final close aerial view
                  ),
                  orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-50), // More steep angle for building view
                    roll: 0
                  },
                  duration: 2.0,
                  complete: function() {
                    setIsFlying(false);
                    if (onFlyComplete) {
                      console.log('Fly complete in Cesium, triggering callback');
                      onFlyComplete();
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
  }, [selectedLocation, onFlyComplete, mapError, isFlying, isInitialized]);
  
  // If there's an error loading the map, display an error message
  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <h3 className="text-xl font-bold mb-2">Cesium Map Error</h3>
          <p>{mapError}</p>
          <p className="text-sm mt-4">Falling back to 2D map view...</p>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingMap) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <h3 className="text-xl font-bold mb-2">Loading 3D Globe</h3>
          <p>Please wait while we initialize the map...</p>
        </div>
      </div>
    );
  }
  
  return <div ref={cesiumContainer} className="w-full h-full" />;
};

export default CesiumMap;
