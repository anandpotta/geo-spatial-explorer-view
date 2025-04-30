
import { useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

export function useFileUploadDialog() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null);

  const openFileUploadDialog = (
    featureGroupRef: React.RefObject<L.FeatureGroup>,
    drawingId: string
  ) => {
    setSelectedDrawing(drawingId);
    
    if (!featureGroupRef.current) {
      toast.error('Could not prepare upload. Please try again.');
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      toast.error('Upload dialog not available');
    }
  };

  return {
    fileInputRef,
    selectedDrawing,
    setSelectedDrawing,
    openFileUploadDialog
  };
}
