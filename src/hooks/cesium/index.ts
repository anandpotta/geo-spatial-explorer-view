
// Placeholder file to maintain compatibility with existing imports
// Now we're using Three.js instead of Cesium

export const useCesiumViewer = () => {
  return {
    viewerRef: { current: null },
    isLoadingMap: false,
    mapError: null,
    isInitialized: true
  };
};

export const useCesiumEntity = () => {
  return {
    entityRef: { current: null }
  };
};

export const useCesiumMap = () => {
  return {
    viewerRef: { current: null },
    entityRef: { current: null },
    isLoadingMap: false,
    mapError: null,
    isInitialized: true
  };
};

export const useCesiumMapInitialization = () => {};

export const initializeViewer = () => {};

export type ViewerInitializationOptions = {
  cesiumContainer: React.RefObject<HTMLDivElement>;
};
