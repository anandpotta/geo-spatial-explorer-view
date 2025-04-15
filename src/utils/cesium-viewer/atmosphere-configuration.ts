
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
      
      // Set atmospheric properties for better visibility
      if ('hueShift' in viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.1;
        viewer.scene.skyAtmosphere.brightnessShift = 3.0; // Increased brightness
      }
      
      // Avoid using setDynamicLighting which might not exist in this Cesium version
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
      viewer.canvas.style.zIndex = '10000'; // Higher z-index
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
    viewer.scene.globe.baseColor = new Cesium.Color(0.0, 1.0, 1.0, 1.0); // Bright cyan color for better visibility
    
    // Explicitly set high visibility values
    const globe = viewer.scene.globe;
    globe.showGroundAtmosphere = true;
    globe.enableLighting = true;
    
    // Force background to be black for better contrast
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    
    // Make globe fully opaque
    if ('translucency' in globe) {
      globe.translucency.enabled = false;
      globe.translucency.frontFaceAlpha = 1.0;
      globe.translucency.backFaceAlpha = 1.0;
    }
    
    // Disable fog for better visibility
    if (viewer.scene.fog) {
      viewer.scene.fog.enabled = false;
    }
    
    // Force sky atmosphere to be visible with increased brightness
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
      if ('brightnessShift' in viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.brightnessShift = 5.0; // Much brighter
      }
    }
    
    // Force multiple renders
    for (let i = 0; i < 30; i++) {
      viewer.scene.requestRender();
    }
    
    // Make sure canvas is fully visible with explicit styles
    if (viewer.canvas) {
      viewer.canvas.style.visibility = 'visible';
      viewer.canvas.style.display = 'block';
      viewer.canvas.style.opacity = '1';
      viewer.canvas.style.position = 'absolute';
      viewer.canvas.style.top = '0';
      viewer.canvas.style.left = '0';
      viewer.canvas.style.width = '100%';
      viewer.canvas.style.height = '100%';
      viewer.canvas.style.zIndex = '10000'; // Maximum z-index
      
      // Force canvas to be properly sized
      if (viewer.canvas.width === 0 || viewer.canvas.height === 0) {
        const containerElement = viewer.canvas.parentElement;
        if (containerElement) {
          // Force dimensions
          containerElement.style.width = '100%';
          containerElement.style.height = '100%';
          containerElement.style.minWidth = '300px';
          containerElement.style.minHeight = '300px';
        }
        
        // Force resize
        viewer.resize();
      }
    }
    
    // Add a CSS rule to ensure all .cesium-widget elements are visible
    const style = document.createElement('style');
    style.textContent = `
      .cesium-widget, .cesium-widget canvas, .cesium-viewer {
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
        z-index: 10000 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Force one more resize and render
    viewer.resize();
    viewer.scene.requestRender();
  } catch (e) {
    console.error('Error in forceGlobeVisibility:', e);
  }
}
