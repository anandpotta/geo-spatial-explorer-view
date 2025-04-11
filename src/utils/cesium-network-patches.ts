
import * as Cesium from 'cesium';

/**
 * Patches Cesium methods to prevent network requests in offline mode.
 * This helps run Cesium without requiring internet access or API keys.
 */
export function patchCesiumToPreventNetworkRequests() {
  try {
    // Block IAU2006XysData which is causing the errors
    if ((Cesium as any).Iau2006XysData) {
      const xysData = (Cesium as any).Iau2006XysData;
      xysData.prototype.preload = function() {
        return Promise.resolve();
      };
      
      // Return dummy data instead of making network requests
      xysData.prototype.computeXysRadians = function() {
        return {
          x: 0,
          y: 0,
          s: 0
        };
      };
    }
    
    // Block Transforms class methods that trigger IAU2006XysData loading
    if ((Cesium as any).Transforms) {
      const transforms = (Cesium as any).Transforms;
      const origComputeIcrfToFixedMatrix = transforms.computeIcrfToFixedMatrix;
      
      transforms.computeIcrfToFixedMatrix = function(date, result) {
        // Return identity matrix to avoid errors
        if (!result) {
          result = new Cesium.Matrix3();
        }
        Cesium.Matrix3.clone(Cesium.Matrix3.IDENTITY, result);
        return result;
      };
      
      const origComputeFixedToIcrfMatrix = transforms.computeFixedToIcrfMatrix;
      
      transforms.computeFixedToIcrfMatrix = function(date, result) {
        // Return identity matrix to avoid errors
        if (!result) {
          result = new Cesium.Matrix3();
        }
        Cesium.Matrix3.clone(Cesium.Matrix3.IDENTITY, result);
        return result;
      };
    }
    
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
    
    console.log('Successfully patched Cesium network requests');
  } catch (e) {
    console.error('Error patching Cesium network functions:', e);
  }
}

/**
 * Patches imagery and terrain providers to prevent network requests
 */
export function patchCesiumProviders() {
  try {
    // 1. Patch IonImageryProvider and ImageryLayer related functionality
    if (Cesium.IonImageryProvider) {
      Cesium.IonImageryProvider.fromAssetId = function(...args: any[]) {
        console.log('Blocked IonImageryProvider.fromAssetId');
        return Promise.reject(new Error('Network requests are disabled'));
      };
    }
    
    // Patch ImageryLayer.fromWorldImagery
    if (Cesium.ImageryLayer) {
      // Instead of modifying the read-only function, intercept its usage
      const original = Cesium.ImageryLayer.fromWorldImagery;
      Object.defineProperty(Cesium.ImageryLayer, 'fromWorldImagery', {
        value: function() {
          console.log('Blocked ImageryLayer.fromWorldImagery');
          return null;
        },
        writable: true
      });
    }
    
    // 2. Block terrain-related functionality
    if (Cesium.CesiumTerrainProvider) {
      Cesium.CesiumTerrainProvider.fromUrl = function(...args: any[]) {
        console.log('Blocked CesiumTerrainProvider.fromUrl');
        return Promise.reject(new Error('Network requests are disabled'));
      };
    }
    
    // Intercept ApproximateTerrainHeights.initialize
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
    
    console.log('Successfully patched Cesium providers');
  } catch (e) {
    console.error('Error patching Cesium providers:', e);
  }
}
