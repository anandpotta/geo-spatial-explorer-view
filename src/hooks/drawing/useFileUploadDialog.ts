
import { useRef, useState } from 'react';
import L from 'leaflet';
import { useMapValidation } from './useMapValidation';

export function useFileUploadDialog() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);
  const { checkMapValidity } = useMapValidation();
  
  const openFileUploadDialog = (
    featureGroupRef: React.RefObject<L.FeatureGroup>, 
    drawingId: string
  ) => {
    if (!featureGroupRef.current || !checkMapValidity(featureGroupRef.current)) return;
    
    setSelectedDrawing(drawingId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return {
    fileInputRef,
    selectedDrawing,
    setSelectedDrawing,
    openFileUploadDialog
  };
}
