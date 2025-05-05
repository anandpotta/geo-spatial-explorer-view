
import { useState, useRef } from 'react';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useSvgPathTracking } from './useSvgPathTracking';

interface UseDrawingControlsStateProps {
  onPathsUpdated?: (paths: string[]) => void;
}

export function useDrawingControlsState({ onPathsUpdated }: UseDrawingControlsStateProps = {}) {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawToolsRef = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paths updated wrapper function
  const handlePathsUpdated = (paths: string[]) => {
    if (onPathsUpdated) {
      onPathsUpdated(paths);
    }
  };

  // Setup path tracking
  const { svgPaths, setSvgPaths, activePathsRef } = useSvgPathTracking({
    isInitialized,
    drawToolsRef,
    mountedRef,
    onPathsUpdated: handlePathsUpdated
  });

  return {
    featureGroupRef,
    drawToolsRef,
    mountedRef,
    isInitialized,
    setIsInitialized,
    selectedDrawing,
    setSelectedDrawing,
    fileInputRef,
    svgPaths,
    setSvgPaths,
    activePathsRef
  };
}
