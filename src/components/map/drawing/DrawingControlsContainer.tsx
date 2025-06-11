
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { useDrawingControls } from '@/hooks/useDrawingControls';
import { useDrawingAuth } from '@/hooks/useDrawingAuth';
import { useFileUploadHandling } from '@/hooks/useFileUploadHandling';
import DrawingControlsEffects from './DrawingControlsEffects';
import LayerManagerWrapper from './LayerManagerWrapper';
import FileUploadInput from './FileUploadInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useDrawings } from '@/hooks/useDrawings';

interface DrawingControlsContainerProps {
  onShapeCreated: (shape: any) => void;
  activeTool: string | null;
  onRegionClick: (drawing: any) => void;
  onClearAll?: () => void;
}

const DrawingControlsContainer = forwardRef<any, DrawingControlsContainerProps>(
  ({ onShapeCreated, activeTool, onRegionClick, onClearAll }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUploadDialog, setShowUploadDialog] = React.useState(false);
    const [selectedDrawingId, setSelectedDrawingId] = React.useState<string | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    
    const { currentUser } = useDrawingAuth();
    const { savedDrawings } = useDrawings();
    
    const {
      featureGroupRef,
      drawToolsRef,
      mountedRef,
      isInitialized,
      setIsInitialized
    } = useDrawingControls();
    
    const {
      handleFileChange
    } = useFileUploadHandling({ 
      onUploadToDrawing: (drawingId: string, file: File) => {
        console.log(`Upload to drawing ${drawingId}:`, file.name);
      }
    });
    
    // Handle upload request from layer clicks
    const handleUploadRequest = React.useCallback((drawingId: string) => {
      console.log(`Upload request received for drawing: ${drawingId}`);
      setSelectedDrawingId(drawingId);
      setShowUploadDialog(true);
    }, []);
    
    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !selectedDrawingId) return;
      
      setIsUploading(true);
      setUploadError(null);
      
      try {
        // Use the existing file handling logic
        await handleFileChange(event);
        setShowUploadDialog(false);
        setSelectedDrawingId(null);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadError('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };
    
    // Handle dialog close
    const handleDialogClose = () => {
      setShowUploadDialog(false);
      setSelectedDrawingId(null);
      setUploadError(null);
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    useImperativeHandle(ref, () => ({
      getMap: () => null, // This would need to be implemented based on your map structure
      getFeatureGroup: () => featureGroupRef.current,
      clearAll: () => {
        if (onClearAll) {
          onClearAll();
        }
      }
    }));
    
    if (!currentUser) {
      return null;
    }
    
    return (
      <>
        <DrawingControlsEffects
          activeTool={activeTool}
          isInitialized={isInitialized}
        />
        
        <LayerManagerWrapper
          featureGroup={featureGroupRef.current}
          savedDrawings={savedDrawings}
          activeTool={activeTool}
          onRegionClick={onRegionClick}
          onUploadRequest={handleUploadRequest}
        />
        
        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload size={20} />
                Upload Floor Plan
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select an image file to upload as a floor plan for this drawing region.
              </p>
              
              <FileUploadInput
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                disabled={isUploading}
              />
              
              {uploadError && (
                <div className="text-sm text-destructive">
                  {uploadError}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleDialogClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

DrawingControlsContainer.displayName = 'DrawingControlsContainer';

export default DrawingControlsContainer;
