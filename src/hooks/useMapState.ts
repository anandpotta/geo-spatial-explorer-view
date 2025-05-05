
import { useState } from 'react';
import { Location, LocationMarker } from '@/utils/geo-utils';
import { DrawingData } from '@/utils/drawing-utils';
import { useMarkerUpdates } from './map-state/use-marker-updates';
import { useMarkerActions } from './map-state/use-marker-actions';
import { useDrawingActions } from './map-state/use-drawing-actions';
import { useGlobalMarkerPosition } from './map-state/use-global-marker-position';

export function useMapState(selectedLocation?: Location) {
  const [position, setPosition] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.y, selectedLocation.x] : [51.505, -0.09]
  );
  const [zoom, setZoom] = useState(18);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [tempMarker, setTempMarker] = useState<[number, number] | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'pin' | 'area' | 'building'>('building');
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Use smaller, focused hooks
  useMarkerUpdates(setMarkers);
  useGlobalMarkerPosition(setTempMarker);

  const { handleSaveMarker, handleDeleteMarker } = useMarkerActions(
    tempMarker,
    markerName,
    markerType,
    currentDrawing,
    setTempMarker,
    setMarkerName,
    setCurrentDrawing
  );

  const { handleRegionClick } = useDrawingActions(
    setShowFloorPlan,
    setSelectedDrawing
  );

  return {
    position,
    setPosition,
    zoom,
    setZoom,
    markers,
    setMarkers,
    drawings,
    setDrawings,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing,
    activeTool,
    setActiveTool,
    handleSaveMarker,
    handleDeleteMarker,
    handleRegionClick
  };
}
