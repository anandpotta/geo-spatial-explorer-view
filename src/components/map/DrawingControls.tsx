
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';
import { useDrawings } from '@/hooks/useDrawings';
import DrawTools from './DrawTools';
import LayerManager from './drawing/LayerManager';
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { toast } from 'sonner';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawingControlsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick?: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

declare module 'leaflet' {
  interface Layer {
    drawingId?: string;
  }
}

const DrawingControls = forwardRef(({ 
  onCreated, 
  activeTool, 
  onRegionClick, 
  onClearAll, 
  onRemoveShape,
  onUploadToDrawing
}: DrawingControlsProps, ref) => {
  const featureGroupRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawToolsRef = useRef<any>(null);
  const { savedDrawings } = useDrawings();
  const mountedRef = useRef<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    activateEditMode: () => {
      if (drawToolsRef.current?.getEditControl()) {
        // Safer activation of edit mode with error handling
        try {
          console.log("Attempting to activate edit mode");
          const editControl = drawToolsRef.current.getEditControl();
          if (editControl) {
            // Get the handler from current implementation
            const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
            if (editHandler && typeof editHandler.enable === 'function') {
              editHandler.enable();
              console.log("Edit mode activated successfully");
            } else {
              console.warn("Edit handler not found or not a function");
            }
          }
        } catch (err) {
          console.error('Failed to activate edit mode:', err);
          toast.error('Could not enable edit mode');
        }
      } else {
        console.warn("Draw tools ref or edit control not available");
      }
    },
    // New method to trigger file upload dialog
    openFileUploadDialog: (drawingId: string) => {
      setSelectedDrawing(drawingId);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }));
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawing && onUploadToDrawing) {
      const file = e.target.files[0];
      onUploadToDrawing(selectedDrawing, file);
      e.target.value = ''; // Reset file input
    }
  };
  
  useEffect(() => {
    getDrawingIdsWithFloorPlans();
    
    const handleFloorPlanUpdated = () => {
      if (featureGroupRef.current && mountedRef.current) {
        try {
          // Don't clear layers on floor plan update - we just want to redraw them with new styles
          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error('Error handling floor plan update:', err);
        }
      }
    };
    
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      mountedRef.current = false;
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, []);

  // Effect to activate edit mode when activeTool changes to 'edit'
  useEffect(() => {
    if (activeTool === 'edit' && isInitialized) {
      setTimeout(() => {
        try {
          if (drawToolsRef.current && mountedRef.current) {
            console.log("Activating edit mode from effect");
            // Try to activate edit mode safely
            const editControl = drawToolsRef.current.getEditControl();
            if (editControl) {
              // More careful handling of edit mode activation
              const editHandler = editControl._toolbars?.edit?._modes?.edit?.handler;
              if (editHandler && typeof editHandler.enable === 'function') {
                editHandler.enable();
                console.log("Edit mode activated successfully from effect");
              } else {
                console.warn("Edit handler not available");
              }
            } else {
              console.warn("Edit control not available");
            }
          }
        } catch (err) {
          console.error('Error activating edit mode:', err);
          toast.error('Could not enable edit mode');
        }
      }, 300);
    }
  }, [activeTool, isInitialized]);

  useEffect(() => {
    if (featureGroupRef.current) {
      setIsInitialized(true);
    }
  }, []);

  const handleClearAll = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
      
      const markers = getSavedMarkers();
      markers.forEach(marker => {
        deleteMarker(marker.id);
      });
      
      localStorage.removeItem('savedMarkers');
      localStorage.removeItem('savedDrawings');
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      
      if (onClearAll) {
        onClearAll();
      }
      
      toast.success('All drawings and markers cleared');
    }
  };

  const handleRemoveShape = (drawingId: string) => {
    if (onRemoveShape) {
      onRemoveShape(drawingId);
    }
  };

  const handleDrawingClick = (drawing: DrawingData) => {
    if (onRegionClick) {
      onRegionClick(drawing);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
      />
      <FeatureGroup ref={featureGroupRef}>
        {featureGroupRef.current && isInitialized && (
          <LayerManager 
            featureGroup={featureGroupRef.current}
            savedDrawings={savedDrawings}
            activeTool={activeTool}
            onRegionClick={handleDrawingClick}
            onRemoveShape={handleRemoveShape}
            onUploadRequest={(drawingId) => {
              setSelectedDrawing(drawingId);
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          />
        )}
        <DrawTools 
          ref={drawToolsRef}
          onCreated={onCreated} 
          activeTool={activeTool} 
          onClearAll={handleClearAll}
          featureGroup={featureGroupRef.current}
        />
      </FeatureGroup>
    </>
  );
});

DrawingControls.displayName = 'DrawingControls';

export default DrawingControls;
