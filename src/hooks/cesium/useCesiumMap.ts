
import { useEffect, useState } from 'react';
import { Location } from '@/utils/geo-utils';
import { useCesiumViewer } from './useCesiumViewer';
import { useCesiumEntity } from './useCesiumEntity';
import { useCesiumMapInitialization } from './useCesiumMapInitialization';

interface UseCesiumMapResult {
  viewerRef: ReturnType<typeof useCesiumViewer>['viewerRef'];
  entityRef: ReturnType<typeof useCesiumEntity>['entityRef'];
  isLoadingMap: boolean;
  mapError: string | null;
  isInitialized: boolean;
}

/**
 * Main hook combining Cesium viewer and entity management
 * Refactored to use more focused hooks
 */
export const useCesiumMap = (
  cesiumContainer: React.RefObject<HTMLDivElement>,
  onMapReady?: () => void
): UseCesiumMapResult => {
  // Get viewer state from dedicated hook
  const { 
    viewerRef, 
    isLoadingMap, 
    mapError, 
    isInitialized 
  } = useCesiumViewer(cesiumContainer, onMapReady);
  
  // Get entity management from dedicated hook
  const { entityRef } = useCesiumEntity();
  
  // Hook for handling map initialization side effects
  useCesiumMapInitialization(viewerRef, isInitialized);
  
  return {
    viewerRef,
    entityRef,
    isLoadingMap,
    mapError,
    isInitialized
  };
};
