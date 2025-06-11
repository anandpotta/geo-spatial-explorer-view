
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";
import { saveFloorPlan, getFloorPlanById } from "@/utils/floor-plan-utils";
import { applyImageClipMask } from "@/utils/svg-clip-mask";
import { findSvgPathByDrawingId } from "@/utils/svg-path-finder";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      setIsLoading(true);
      
      const loadFloorPlan = async () => {
        try {
          console.log('Loading floor plan for drawing:', drawing.id);
          const savedFloorPlan = await getFloorPlanById(drawing.id);
          if (savedFloorPlan) {
            console.log('Found saved floor plan:', savedFloorPlan.fileName);
            setSelectedImage(savedFloorPlan.data);
            setIsPdf(savedFloorPlan.isPdf);
            setFileName(savedFloorPlan.fileName);
          } else {
            console.log('No saved floor plan found for drawing:', drawing.id);
            // Reset state if no floor plan is found
            setSelectedImage(null);
            setIsPdf(false);
            setFileName('');
          }
        } catch (error) {
          console.error('Error loading floor plan:', error);
          setSelectedImage(null);
          setIsPdf(false);
          setFileName('');
        }
        setIsLoading(false);
      };
      
      loadFloorPlan();
    }
  }, [drawing]);

  // Helper function to find path with retries
  const findPathWithRetries = async (drawingId: string, maxRetries = 3): Promise<SVGPathElement | null> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`[FloorPlanView] Path finding attempt ${attempt + 1}/${maxRetries}`);
      
      const pathElement = findSvgPathByDrawingId(drawingId);
      if (pathElement) {
        console.log(`[FloorPlanView] Found path on attempt ${attempt + 1}`);
        return pathElement;
      }
      
      // Wait a bit before retrying to allow DOM to update
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`[FloorPlanView] Failed to find path after ${maxRetries} attempts`);
    return null;
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('[FloorPlanView] Starting file upload for:', file.name, 'Drawing ID:', drawing?.id);
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    // Check file size - be more restrictive to avoid storage issues
    if (file.size > 1 * 1024 * 1024) { // Reduced to 1MB limit
      toast.error('File size must be less than 1MB to ensure proper storage');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (result && drawing?.id) {
          const dataUrl = result as string;
          console.log('[FloorPlanView] File read successfully, data URL length:', dataUrl.length);
          
          // Check if SVG path exists BEFORE upload with enhanced search
          console.log('[FloorPlanView] Checking for SVG path BEFORE upload...');
          let pathElementBefore = await findPathWithRetries(drawing.id);
          console.log('[FloorPlanView] SVG path before upload:', pathElementBefore ? 'EXISTS' : 'NOT FOUND');
          
          if (pathElementBefore) {
            console.log('[FloorPlanView] Path element details before upload:', {
              tagName: pathElementBefore.tagName,
              id: pathElementBefore.id,
              classList: Array.from(pathElementBefore.classList),
              hasClipMask: pathElementBefore.getAttribute('data-has-clip-mask'),
              drawingId: pathElementBefore.getAttribute('data-drawing-id')
            });
          }
          
          // Try to compress the image if it's too large
          let finalDataUrl = dataUrl;
          if (dataUrl.length > 500000) { // If data URL is larger than 500KB
            console.log('[FloorPlanView] Data URL is large, attempting to compress...');
            try {
              // Create canvas to compress image
              const img = new Image();
              img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (max 800px width/height)
                const maxSize = 800;
                let { width, height } = img;
                
                if (width > height) {
                  if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                  }
                } else {
                  if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                  }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  finalDataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress to 70% quality
                  console.log('[FloorPlanView] Compressed data URL length:', finalDataUrl.length);
                  
                  await saveAndApplyFloorPlan(finalDataUrl);
                }
              };
              img.src = dataUrl;
            } catch (compressionError) {
              console.error('[FloorPlanView] Error compressing image:', compressionError);
              await saveAndApplyFloorPlan(dataUrl);
            }
          } else {
            await saveAndApplyFloorPlan(dataUrl);
          }
          
          async function saveAndApplyFloorPlan(imageData: string) {
            // Update UI immediately for better user experience
            setSelectedImage(imageData);
            setIsPdf(file.type.includes('pdf'));
            setFileName(file.name);
            
            // Save to storage with better error handling
            console.log('[FloorPlanView] Saving floor plan to storage...');
            try {
              const success = saveFloorPlan(
                drawing.id,
                {
                  data: imageData,
                  isPdf: file.type.includes('pdf'),
                  fileName: file.name
                }
              );
              
              if (success) {
                console.log('[FloorPlanView] Floor plan saved successfully');
                toast.success(`${file.name} uploaded successfully`);
                
                // Apply clip mask to the SVG path if it's an image (not PDF)
                if (!file.type.includes('pdf')) {
                  console.log('[FloorPlanView] Applying clip mask for drawing:', drawing.id);
                  
                  // Use the enhanced path finder with retries
                  const pathElement = await findPathWithRetries(drawing.id, 5);
                  
                  if (pathElement) {
                    console.log('[FloorPlanView] Found path element, applying clip mask');
                    console.log('[FloorPlanView] Path element details:', {
                      tagName: pathElement.tagName,
                      id: pathElement.id,
                      classList: Array.from(pathElement.classList),
                      parentElement: pathElement.parentElement?.tagName,
                      isInDocument: document.contains(pathElement)
                    });
                    
                    const success = applyImageClipMask(pathElement, imageData, drawing.id);
                    if (success) {
                      console.log('[FloorPlanView] Clip mask applied successfully');
                    } else {
                      console.error('[FloorPlanView] Failed to apply clip mask');
                      toast.error('Image uploaded but failed to apply to shape. Please try again.');
                    }
                  } else {
                    console.warn('[FloorPlanView] No path element found for drawing:', drawing.id);
                    toast.warning('Image uploaded but shape not found on map. Try refreshing the page.');
                  }
                }
                
                // Trigger a custom event to ensure clip masks are applied
                console.log('[FloorPlanView] Dispatching floorPlanUpdated event');
                window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
                  detail: { drawingId: drawing.id }
                }));
              } else {
                console.error('[FloorPlanView] Failed to save floor plan to storage');
                // Revert UI state if save failed
                setSelectedImage(null);
                setIsPdf(false);
                setFileName('');
                toast.error('Failed to save floor plan. Please try a smaller file.');
              }
            } catch (saveError) {
              console.error('[FloorPlanView] Error during floor plan save:', saveError);
              // Revert UI state if save failed
              setSelectedImage(null);
              setIsPdf(false);
              setFileName('');
              toast.error('Storage error. Please try a smaller file or clear some data.');
            }
          }
        }
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        console.error('[FloorPlanView] FileReader error occurred');
        toast.error('Failed to read uploaded file');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[FloorPlanView] Error processing file:', err);
      toast.error('Failed to process upload');
      setIsUploading(false);
    }
    
    // Clear the input so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const triggerFileInput = () => {
    const fileInput = document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Helper function to calculate proper scaling for the image
  const calculateFitScale = (imgWidth: number, imgHeight: number, containerWidth: number, containerHeight: number) => {
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    return Math.min(widthRatio, heightRatio, 1); // Never scale up, only down
  };

  return (
    <div className="relative w-full h-full">
      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white/80 backdrop-blur-sm"
        >
          <FlipHorizontal className="mr-2 h-4 w-4" />
          Back to Map
        </Button>
        <Button
          variant="outline"
          className="bg-white/80 backdrop-blur-sm"
          disabled={isUploading}
          onClick={triggerFileInput}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading 
            ? 'Processing...' 
            : (selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan')}
        </Button>
      </div>
      
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
            <p>Loading floor plan...</p>
          </div>
        ) : selectedImage ? (
          <div className="space-y-4 text-center max-w-[90%]">
            <h2 className="text-xl font-semibold">
              {drawing?.properties?.name || 'Floor Plan View'} 
              {fileName && <span className="text-sm font-normal ml-2 text-gray-500">({fileName})</span>}
            </h2>
            
            {isPdf ? (
              <div className="w-full max-h-[75vh] overflow-hidden rounded-lg shadow-lg border border-gray-200">
                <iframe 
                  src={selectedImage} 
                  className="w-full h-[70vh]" 
                  title="PDF Floor Plan"
                />
              </div>
            ) : (
              <img
                src={selectedImage}
                alt="Floor Plan"
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  const container = img.parentElement?.parentElement;
                  if (container) {
                    const containerWidth = container.clientWidth * 0.9;
                    const containerHeight = container.clientHeight * 0.7;
                    const scale = calculateFitScale(img.naturalWidth, img.naturalHeight, containerWidth, containerHeight);
                    if (scale < 1) {
                      img.style.maxWidth = `${img.naturalWidth * scale}px`;
                      img.style.maxHeight = `${img.naturalHeight * scale}px`;
                    }
                  }
                }}
              />
            )}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium">Upload Floor Plan</h3>
              <p className="text-gray-600 text-center max-w-md">
                Click the Upload Floor Plan button above to add a floor plan image or PDF (max 1MB)
              </p>
              <Button 
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Processing...' : 'Select File'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
