
import { DrawingData } from '@/utils/drawing-utils';
import DrawingControls from '../DrawingControls';
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { debugSvgElement } from '@/utils/svg-debug-utils';
import { storeFloorPlan, getFloorPlan, getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';
import { getCurrentUser } from '@/services/auth-service';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: DrawingData) => void;
  onClearAll?: () => void;
  onRemoveShape?: (drawingId: string) => void;
}

const DrawingControlsContainer = forwardRef<DrawingControlsRef, DrawingControlsContainerProps>(({
  onShapeCreated,
  activeTool,
  onRegionClick,
  onClearAll,
  onRemoveShape
}: DrawingControlsContainerProps, ref) => {
  const drawingControlsRef = useRef<DrawingControlsRef>(null);
  const [svgPaths, setSvgPaths] = useState<string[]>([]);
  const attemptQueueRef = useRef<Map<string, number>>(new Map());
  const [reapplyTriggered, setReapplyTriggered] = useState(false);
  
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => {
      return drawingControlsRef.current?.getFeatureGroup() as L.FeatureGroup;
    },
    getDrawTools: () => {
      return drawingControlsRef.current?.getDrawTools();
    },
    openFileUploadDialog: (drawingId: string) => {
      drawingControlsRef.current?.openFileUploadDialog(drawingId);
    },
    getSvgPaths: () => {
      return drawingControlsRef.current?.getSvgPaths() || [];
    }
  }));

  // Function to apply a clip mask with retry logic
  const applyClipMaskWithRetry = (drawingId: string) => {
    console.log(`Attempting to apply clip mask for ${drawingId}`);
    const floorPlanData = getFloorPlan(drawingId);
    
    if (floorPlanData && floorPlanData.imageData) {
      const pathElement = findSvgPathByDrawingId(drawingId);
      if (pathElement) {
        console.log(`Found path element for ${drawingId}, applying clip mask`);
        debugSvgElement(pathElement, `Before applying clip mask to ${drawingId}`);
        
        const result = applyImageClipMask(
          pathElement, 
          floorPlanData.imageData, 
          drawingId
        );
        
        if (result) {
          console.log(`Successfully applied clip mask for ${drawingId}`);
          debugSvgElement(pathElement, `After applying clip mask to ${drawingId}`);
          
          // Force SVG update
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
          
          return true;
        } else {
          console.log(`Failed to apply clip mask for ${drawingId}, will retry`);
          return false;
        }
      } else {
        console.log(`Path element not found for ${drawingId}`);
        return false;
      }
    }
    return false;
  };

  // Listen for floorPlanUpdated events to attempt reapplying clipmasks
  useEffect(() => {
    const handleFloorPlanUpdated = (event: CustomEvent) => {
      const { drawingId } = event.detail || {};
      console.log('Floor plan updated event received:', drawingId);
      
      if (drawingId) {
        // Initialize retry counter if not set
        if (!attemptQueueRef.current.has(drawingId)) {
          attemptQueueRef.current.set(drawingId, 0);
        }
        
        const tryApply = () => {
          const attempts = attemptQueueRef.current.get(drawingId) || 0;
          
          if (attempts >= 10) {
            console.warn(`Maximum retries reached for ${drawingId}`);
            attemptQueueRef.current.delete(drawingId);
            return;
          }
          
          attemptQueueRef.current.set(drawingId, attempts + 1);
          
          setTimeout(() => {
            const success = applyClipMaskWithRetry(drawingId);
            if (!success && attemptQueueRef.current.has(drawingId)) {
              console.log(`Retry ${attempts + 1}/10 for ${drawingId}`);
              tryApply();
            } else if (success) {
              attemptQueueRef.current.delete(drawingId);
            }
          }, Math.min(300 * (attempts + 1), 2000));
        };
        
        tryApply();
      }
    };
    
    // Also listen for clipMaskUpdated events
    const handleClipMaskUpdated = (event: CustomEvent) => {
      const { drawingId } = event.detail || {};
      console.log('Clip mask updated event received:', drawingId);
      
      if (drawingId) {
        // Force SVG update to make sure the change is visible
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    };
    
    // Listen for visibility changes to reapply clip masks when returning to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, checking for drawings with floor plans to reapply');
        setReapplyTriggered(prev => !prev); // Toggle to trigger useEffect
      }
    };

    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
    window.addEventListener('clipMaskUpdated', handleClipMaskUpdated as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial application of clip masks
    setTimeout(() => {
      setReapplyTriggered(prev => !prev);
    }, 1000);
    
    return () => {
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated as EventListener);
      window.removeEventListener('clipMaskUpdated', handleClipMaskUpdated as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Effect to reapply all clip masks when needed
  useEffect(() => {
    // This will run when reapplyTriggered changes (on page visibility or component mount)
    const reapplyAllClipMasks = () => {
      const drawingIds = getDrawingIdsWithFloorPlans();
      console.log(`Attempting to reapply all clip masks for ${drawingIds.length} drawings`);
      
      if (drawingIds.length === 0) return;
      
      // Stagger applications to avoid overwhelming the browser
      drawingIds.forEach((drawingId, index) => {
        setTimeout(() => {
          applyClipMaskWithRetry(drawingId);
        }, index * 200);
      });
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(reapplyAllClipMasks, 500);
    return () => clearTimeout(timer);
  }, [reapplyTriggered]);
  
  const handleUploadToDrawing = (drawingId: string, file: File) => {
    console.log(`Processing upload for drawing ${drawingId}, file: ${file.name}`);
    
    // Check if user is logged in
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('You must be logged in to upload files');
      return;
    }
    
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // Show loading toast
    const loadingId = toast.loading('Processing image...');
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        console.log(`File read complete for ${file.name}`);
        
        try {
          // Save the file data to localStorage using our helper
          storeFloorPlan(drawingId, e.target.result as string);
          console.log(`Saved floor plan to localStorage for drawing ${drawingId}`);
          
          // Dismiss loading toast
          toast.dismiss(loadingId);
          toast.success(`Floor plan "${file.name}" saved`);
          
          // Initialize retry counter
          attemptQueueRef.current.set(drawingId, 0);
          
          // Trigger a custom event to notify components that a floor plan was uploaded
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
            detail: { drawingId } 
          }));
          
          // Reset the retry counter after 3 seconds
          setTimeout(() => {
            attemptQueueRef.current.delete(drawingId);
          }, 3000);
        } catch (err) {
          console.error('Error storing floor plan:', err);
          toast.dismiss(loadingId);
          toast.error('Error saving floor plan: Storage quota may be full');
        }
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      toast.dismiss(loadingId);
      toast.error('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
  };
  
  const handlePathsUpdated = (paths: string[]) => {
    setSvgPaths(paths);
    console.log('SVG Paths updated:', paths);
  };
  
  return (
    <DrawingControls 
      ref={drawingControlsRef}
      onCreated={onShapeCreated}
      activeTool={activeTool}
      onRegionClick={onRegionClick}
      onClearAll={onClearAll}
      onRemoveShape={onRemoveShape}
      onUploadToDrawing={handleUploadToDrawing}
      onPathsUpdated={handlePathsUpdated}
    />
  );
});

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
