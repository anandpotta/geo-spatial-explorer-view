
import * as Cesium from 'cesium';

export interface ViewerInitializationOptions {
  cesiumContainer: React.RefObject<HTMLDivElement>;
  viewerRef: React.MutableRefObject<Cesium.Viewer | null>;
  initializationAttempts: React.MutableRefObject<number>;
  initTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  checkRenderIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  renderTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  setIsInitialized: (value: boolean) => void;
  setIsLoadingMap: (value: boolean) => void;
  setMapError: (value: string | null) => void;
  onMapReady?: () => void;
}
