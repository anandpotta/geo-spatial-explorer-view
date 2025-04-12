
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
    
    // Block any network requests through Resource
    if (Cesium.Resource) {
      // Create a dummy response to prevent CORS errors
      const createDummyResponse = () => {
        return Promise.resolve(new Response(new Blob(), {
          status: 200,
          headers: { 'Content-Type': 'application/octet-stream' }
        }));
      };
      
      // Override fetch methods with mock implementations
      Cesium.Resource.prototype.fetch = function() {
        console.log('Blocked network request:', this._url);
        return createDummyResponse();
      };
      
      // Return HTMLImageElement for fetchImage instead of canvas
      Cesium.Resource.prototype.fetchImage = function() {
        console.log('Blocked image request:', this._url);
        const img = new Image(1, 1);
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent GIF
        return Promise.resolve(img);
      };
      
      Cesium.Resource.prototype.fetchJson = function() {
        console.log('Blocked JSON request:', this._url);
        return Promise.resolve({});
      };
      
      // Return XMLDocument for fetchXML instead of HTMLDivElement
      Cesium.Resource.prototype.fetchXML = function() {
        console.log('Blocked XML request:', this._url);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString('<root></root>', 'text/xml');
        return Promise.resolve(xmlDoc);
      };
      
      Cesium.Resource.prototype.fetchText = function() {
        console.log('Blocked text request:', this._url);
        return Promise.resolve('');
      };
    }
    
    // Prevent web workers which can cause CORS issues
    if ((Cesium as any).TaskProcessor) {
      (Cesium as any).TaskProcessor.prototype.execute = function() {
        return Promise.resolve({});
      };
    }
    
    // Disable RequestScheduler
    if ((Cesium as any).RequestScheduler) {
      const scheduler = (Cesium as any).RequestScheduler;
      scheduler.maximumRequestsPerServer = 0;
      scheduler.requestsByServer = {};
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
      Cesium.IonImageryProvider.fromAssetId = function() {
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
      Cesium.CesiumTerrainProvider.fromUrl = function() {
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
