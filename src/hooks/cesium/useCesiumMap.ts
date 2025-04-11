
import { useEffect, useState, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { flyToLocation } from '@/utils/cesium-utils';
import { useCesiumViewer } from './useCesiumViewer';
import { useCesiumEntity } from './useCesiumEntity';

interface UseCesiumMapResult {
  viewerRef: ReturnType<typeof useCesiumViewer>['viewerRef'];
  entityRef: ReturnType<typeof useCesiumEntity>['entityRef'];
  isLoadingMap: boolean;
  mapError: string | null;
  isInitialized: boolean;
}

/**
 * Main hook combining Cesium viewer and entity management
 */
export const useCesiumMap = (
  cesiumContainer: React.RefObject<HTMLDivElement>,
  onMapReady?: () => void
): UseCesiumMapResult => {
  const { viewerRef, isLoadingMap, mapError, isInitialized } = useCesiumViewer(cesiumContainer, onMapReady);
  const { entityRef } = useCesiumEntity();
  
  return {
    viewerRef,
    entityRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
