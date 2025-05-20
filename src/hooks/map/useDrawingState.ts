
import { useState, useEffect } from 'react';
import { DrawingData, saveDrawing, getSavedDrawings } from '@/utils/drawing-utils';

export function useDrawingState(isAuthenticated: boolean, currentUser: any) {
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingData | null>(null);

  // Load existing drawings when user changes or auth state changes
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Clear data when user logs out
      setDrawings([]);
      return;
    }
    
    console.log(`Loading drawings for user: ${currentUser.id}`);
    
    const savedDrawings = getSavedDrawings();
    setDrawings(savedDrawings);
    
    // Listen for drawing updates
    const handleDrawingsUpdated = () => {
      if (isAuthenticated && currentUser) {
        setDrawings(getSavedDrawings());
      }
    };
    
    // Listen for floor plan updates
    const handleFloorPlanUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.drawingId) {
        console.log(`Floor plan updated for drawing ${customEvent.detail.drawingId}, triggering refresh`);
        // Trigger a refresh of the drawings
        handleDrawingsUpdated();
      }
    };
    
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('storage', handleDrawingsUpdated);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('storage', handleDrawingsUpdated);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, [isAuthenticated, currentUser]);

  const handleRegionClick = (drawing: DrawingData) => {
    setSelectedDrawing(drawing);
    setShowFloorPlan(true);
  };

  // Function to save drawing with updated marker reference
  const saveDrawingWithMarker = (drawing: DrawingData, markerId: string) => {
    if (drawing) {
      // Create a safe copy of drawing without circular references
      const safeDrawing: DrawingData = {
        ...drawing,
        // Remove any potential circular references from geoJSON
        geoJSON: drawing.geoJSON ? JSON.parse(JSON.stringify({
          type: drawing.geoJSON.type,
          geometry: drawing.geoJSON.geometry,
          properties: drawing.geoJSON.properties
        })) : undefined,
        properties: {
          ...drawing.properties,
          associatedMarkerId: markerId
        },
        userId: currentUser?.id
      };
      
      // Save or update the drawing but don't clear it from the map
      saveDrawing(safeDrawing);
      
      // Ensure drawings remain visible by dispatching a custom event
      window.dispatchEvent(new Event('drawingsUpdated'));
    }
  };

  return {
    drawings,
    setDrawings,
    currentDrawing,
    setCurrentDrawing,
    showFloorPlan,
    setShowFloorPlan,
    selectedDrawing,
    setSelectedDrawing,
    handleRegionClick,
    saveDrawingWithMarker
  };
}
