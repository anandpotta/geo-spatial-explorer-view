
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
    
    const { currentUser } = useDrawingAuth();
    
    const {
      map,
      featureGroup,
      editControlRef,
      drawingLayers,
      activeDrawings,
      layersRef,
      removeButtonRoots,
      uploadButtonRoots,
      imageControlRoots,
      isMounted,
      isEditMode,
      onRemoveShape,
      setMap
    } = useDrawingControls();
    
    const {
      uploadFile,
      isUploading,
      uploadError,
      resetUpload
    } = useFileUploadHandling();
    
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
      
      try {
        await uploadFile(file, selectedDrawingId);
        setShowUploadDialog(false);
        setSelectedDrawingId(null);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    };
    
    // Handle dialog close
    const handleDialogClose = () => {
      setShowUploadDialog(false);
      setSelectedDrawingId(null);
      resetUpload();
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    useImperativeHandle(ref, () => ({
      getMap: () => map,
      getFeatureGroup: () => featureGroup,
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
          map={map}
          featureGroup={featureGroup}
          editControlRef={editControlRef}
          activeTool={activeTool}
          onShapeCreated={onShapeCreated}
          setMap={setMap}
        />
        
        <LayerManagerWrapper
          map={map}
          featureGroup={featureGroup}
          drawingLayers={drawingLayers}
          activeDrawings={activeDrawings}
          layersRef={layersRef}
          removeButtonRoots={removeButtonRoots}
          uploadButtonRoots={uploadButtonRoots}
          imageControlRoots={imageControlRoots}
          activeTool={activeTool}
          isMounted={isMounted}
          isEditMode={isEditMode}
          onRegionClick={onRegionClick}
          onRemoveShape={onRemoveShape}
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
                onFileChange={handleFileUpload}
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
