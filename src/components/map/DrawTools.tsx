
import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { EditControl } from "./LeafletCompatibilityLayer";
import L from 'leaflet';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { useDrawToolsConfiguration } from '@/hooks/useDrawToolsConfiguration';
import { useDrawToolsEventHandlers } from '@/hooks/useDrawToolsEventHandlers';
import { useSavedPathsRestoration } from '@/hooks/useSavedPathsRestoration';
import { usePathElementsCleaner } from '@/hooks/usePathElementsCleaner';
import { getDrawOptions } from './drawing/DrawOptionsConfiguration';
import { clearAllMapSvgElements } from '@/utils/svg-path-utils';
import { useClearAllOperation } from '@/hooks/useClearAllOperation';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// Import leaflet CSS directly
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Initialize L.drawVersion to avoid type errors
if (typeof L !== 'undefined' && !L.drawVersion) {
  L.drawVersion = '1.0.4';
}

// Ensure GeometryUtil functions are available
if (typeof L !== 'undefined' && !L.GeometryUtil) {
  L.GeometryUtil = {
    geodesicArea: function(latLngs) {
      let area = 0;
      if (latLngs && latLngs.length > 2) {
        area = Math.abs(L.LatLngUtil.geodesicArea(latLngs));
      }
      return area;
    },
    readableArea: function(area, isMetric = true) {
      let areaStr;
      if (isMetric) {
        if (area >= 10000) {
          areaStr = (area * 0.0001).toFixed(2) + ' ha';
        } else {
          areaStr = area.toFixed(2) + ' m²';
        }
      } else {
        const areaInSqFeet = area * 10.764;
        if (areaInSqFeet >= 43560) {
          areaStr = (areaInSqFeet / 43560).toFixed(2) + ' acres';
        } else {
          areaStr = areaInSqFeet.toFixed(2) + ' ft²';
        }
      }
      return areaStr;
    }
  };
}

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const editControlRef = useRef<any>(null);
  
  // Use hooks for separated functionality
  const { getPathElements, getSVGPathData, clearPathElements } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  // Use the clear all operation hook
  const { 
    showConfirmation, 
    setShowConfirmation, 
    confirmClearAll 
  } = useClearAllOperation(() => {
    if (onClearAll) {
      onClearAll();
    }
  });
  
  // Initialize configuration and event handlers using custom hooks
  useDrawToolsConfiguration(featureGroup);
  useDrawToolsEventHandlers(getPathElements);
  useSavedPathsRestoration(featureGroup);
  usePathElementsCleaner(clearPathElements);
  
  useImperativeHandle(ref, () => ({
    getPathElements,
    getSVGPathData,
    clearPathElements
  }));

  // Get draw options from configuration
  const drawOptions = getDrawOptions();

  return (
    <>
      <EditControl
        ref={editControlRef}
        position="topright"
        onCreated={handleCreated}
        draw={drawOptions}
        edit={{
          featureGroup,
          remove: true
        }}
        featureGroup={featureGroup}
      />
      
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and shapes? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
