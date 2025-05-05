
import * as Cesium from 'cesium';

/**
 * Configures atmosphere for the Earth glow effect
 */
export function configureAtmosphere(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Configure skyAtmosphere for better visibility
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      
      // Use safe property checking to avoid errors with different Cesium versions
      const skyAtmosphere = viewer.scene.skyAtmosphere as any;
      if (skyAtmosphere) {
        // Only set these properties if they exist
        if ('hueShift' in skyAtmosphere) {
          skyAtmosphere.hueShift = 0.0;
          skyAtmosphere.saturationShift = 0.1;
          skyAtmosphere.brightnessShift = 3.0;
        }
        
        // Safely check for dynamicLighting method
        if (typeof skyAtmosphere.setDynamicLighting === 'function') {
          skyAtmosphere.setDynamicLighting(Cesium.SkyAtmosphereDynamicLighting.NONE);
        }
      }
    }
    
    // Enhance globe lighting
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      
      // Set a more vibrant blue color
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
      viewer.scene.globe.show = true;
      
      // Disable translucency which can cause visibility issues
      if ('translucency' in viewer.scene.globe) {
        viewer.scene.globe.translucency.enabled = false;
      }
    }
    
    // Force multiple renders
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
    }
  } catch (e) {
    console.error('Error configuring atmosphere:', e);
  }
}

/**
 * Configures rendering for better globe visibility
 */
export function configureRendering(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene) {
    return;
  }
  
  try {
    // Set vibrant blue color for the globe
    if (viewer.scene.globe) {
      viewer.scene.globe.show = true;
      viewer.scene.globe.baseColor = new Cesium.Color(0.0, 0.8, 1.0, 1.0);
      viewer.scene.globe.depthTestAgainstTerrain = false;
      
      // Force the globe's surface to be correctly rendered
      const tileset = (viewer.scene.globe as any)._surface._tileProvider;
      if (tileset) {
        tileset._debug.wireframe = false;
        tileset._debug.boundingSphereTile = false;
        
        // Force tiles to be loaded and ready
        if (tileset._quadtree) {
          tileset._quadtree.preloadSiblings = true;
        }
      }
    }
    
    // Force multiple render cycles
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
    }
    
    // Enable animation for globe rotation
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 2.0; // Faster rotation
    
    // Make canvas fully visible with high z-index
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.zIndex = '1000'; // Higher z-index
    }
    
    // Force a resize for proper dimensions
    viewer.resize();
    
    // Schedule additional renders after setup
    setTimeout(() => {
      if (!viewer.isDestroyed()) {
        for (let i = 0; i < 20; i++) {
          viewer.scene.requestRender();
        }
        
        // One more resize after renders
        viewer.resize();
      }
    }, 500);
  } catch (e) {
    console.error('Error configuring rendering:', e);
  }
}

/**
 * Forces immediate rendering of the globe with enhanced visibility
 */
export function forceGlobeVisibility(viewer: Cesium.Viewer): void {
  if (!viewer || !viewer.scene || !viewer.scene.globe) {
    return;
  }
  
  try {
    // Make sure the globe is visible with even more vivid blue color
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 1.0, 1.0, 1.0); // Even brighter cyan color
    
    // Force all internal properties to be visible
    const globe = viewer.scene.globe;
    (globe as any)._surface._tilesToRender = [];
    (globe as any)._surface._tileLoadQueue = [];
    
    // Make globe fully opaque
    if (typeof globe.translucency === 'object' && globe.translucency !== null) {
      globe.translucency.frontFaceAlpha = 1.0;
      globe.translucency.backFaceAlpha = 1.0;
    }
    
    // Disable fog and enhance brightness
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      
      // Access these properties safely using type assertion
      const skyAtmosphere = viewer.scene.skyAtmosphere as any;
      if (skyAtmosphere && 'brightnessShift' in skyAtmosphere) {
        skyAtmosphere.brightnessShift = 5.0; // Increase atmosphere brightness
      }
    }
    
    // Force immediate render multiple times
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
    
    // Ensure canvas is fully visible with maximum z-index
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.zIndex = '10000'; // Maximum z-index
      
      // Force size to be 100%
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
      
      // Ensure the canvas has proper dimensions
      const containerElement = viewer.canvas.parentElement;
      if (containerElement && 
          (viewer.canvas.width === 0 || viewer.canvas.height === 0 || 
           containerElement.clientWidth === 0 || containerElement.clientHeight === 0)) {
        // Force dimensions and reflow
        containerElement.style.width = '100%';
        containerElement.style.height = '100%';
        containerElement.style.minWidth = '300px';
        containerElement.style.minHeight = '300px';
        void containerElement.offsetHeight; // Force reflow
        
        // Force resize
        viewer.resize();
      }
    }
    
    // Set black background for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Adjust camera if needed to see the globe
    if (viewer.camera) {
      // Only adjust if too far out
      const distance = Cesium.Cartesian3.magnitude(viewer.camera.position);
      if (distance > 25000000) {
        viewer.camera.lookAt(
          Cesium.Cartesian3.ZERO,
          new Cesium.Cartesian3(0, 0, 10000000) // Even closer look
        );
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      }
    }
    
    // Force another render
    viewer.scene.requestRender();
    
    // Force visibility on all Cesium-related elements more aggressively
    const cesiumElements = document.querySelectorAll('[data-cesium-container="true"], .cesium-widget, .cesium-viewer');
    cesiumElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.visibility = 'visible';
        element.style.display = 'block';
        element.style.opacity = '1';
        element.style.zIndex = '10000';
      }
    });
    
    // Find all canvas elements inside Cesium containers and make them visible
    const canvases = document.querySelectorAll('.cesium-widget canvas, [data-cesium-container="true"] canvas');
    canvases.forEach(canvas => {
      if (canvas instanceof HTMLElement) {
        canvas.style.visibility = 'visible';
        canvas.style.display = 'block';
        canvas.style.opacity = '1';
      }
    });
    
    // Find all cesium widgets and ensure they're visible
    const widgets = document.querySelectorAll('.cesium-widget');
    widgets.forEach(widget => {
      if (widget instanceof HTMLElement) {
        widget.style.visibility = 'visible';
        widget.style.display = 'block';
        widget.style.width = '100%';
        widget.style.height = '100%';
        widget.style.background = 'transparent';
      }
    });
    
    // Force resize and multiple renders
    viewer.resize();
    for (let i = 0; i < 20; i++) {
      viewer.scene.requestRender();
    }
  } catch (e) {
    console.error('Error in forceGlobeVisibility:', e);
  }
}
