
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useEditMode } from '@/hooks/useEditMode';
import { usePathElements } from '@/hooks/usePathElements';
import { useShapeCreation } from '@/hooks/useShapeCreation';
import { toast } from 'sonner';
import DrawToolsCore from './drawing/DrawToolsCore';

interface DrawToolsProps {
  onCreated: (shape: any) => void;
  activeTool: string | null;
  onClearAll?: () => void;
  featureGroup: L.FeatureGroup;
}

const DrawTools = forwardRef(({ onCreated, activeTool, onClearAll, featureGroup }: DrawToolsProps, ref) => {
  const drawToolsCoreRef = useRef<any>(null);
  
  // Use hooks for separated functionality
  const isEditActive = useEditMode(drawToolsCoreRef, activeTool);
  const { getPathElements, getSVGPathData } = usePathElements(featureGroup);
  const { handleCreated } = useShapeCreation(onCreated);
  
  useImperativeHandle(ref, () => ({
    getEditControl: () => drawToolsCoreRef.current?.getEditControl(),
    getPathElements,
    getSVGPathData,
    activateEditMode: () => {
      return drawToolsCoreRef.current?.activateEditMode() || false;
    }
  }));

  return (
    <DrawToolsCore
      ref={drawToolsCoreRef}
      onCreated={handleCreated}
      activeTool={activeTool}
      onClearAll={onClearAll}
      featureGroup={featureGroup}
    />
  );
});

DrawTools.displayName = 'DrawTools';

export default DrawTools;
