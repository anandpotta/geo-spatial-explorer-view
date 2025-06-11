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
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('Starting file upload for:', file.name, 'Drawing ID:', drawing?.id);
    
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
          console.log('File read successfully, data URL length:', dataUrl.length);
          
          // Check if SVG path exists BEFORE upload
          console.log('Checking for SVG path BEFORE upload...');
          const pathElementBefore = findSvgPathByDrawingId(drawing.id);
          console.log('SVG path before upload:', pathElementBefore ? 'EXISTS' : 'NOT FOUND');
          if (pathElementBefore) {
            console.log('Path element details before upload:', {
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
            console.log('Data URL is large, attempting to compress...');
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
                  console.log('Compressed data URL length:', finalDataUrl.length);
                  
                  await saveAndApplyFloorPlan(finalDataUrl);
                }
              };
              img.src = dataUrl;
            } catch (compressionError) {
              console.error('Error compressing image:', compressionError);
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
            console.log('Saving floor plan to storage...');
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
                console.log('Floor plan saved successfully');
                toast.success(`${file.name} uploaded successfully`);
                
                // Apply clip mask to the SVG path if it's an image (not PDF)
                if (!file.type.includes('pdf')) {
                  console.log('Applying clip mask for drawing:', drawing.id);
                  
                  // Check again AFTER storage save
                  console.log('Checking for SVG path AFTER storage save...');
                  const pathElementAfterSave = findSvgPathByDrawingId(drawing.id);
                  console.log('SVG path after storage save:', pathElementAfterSave ? 'EXISTS' : 'NOT FOUND');
                  
                  // Wait a bit for the DOM to update
                  setTimeout(() => {
                    console.log('Attempting to find and apply clip mask...');
                    const pathElement = findSvgPathByDrawingId(drawing.id);
                    if (pathElement) {
                      console.log('Found path element, applying clip mask');
                      console.log('Path element details:', {
                        tagName: pathElement.tagName,
                        id: pathElement.id,
                        classList: Array.from(pathElement.classList),
                        parentElement: pathElement.parentElement?.tagName,
                        isInDocument: document.contains(pathElement)
                      });
                      
                      const success = applyImageClipMask(pathElement, imageData, drawing.id);
                      if (success) {
                        console.log('Clip mask applied successfully');
                      } else {
                        console.error('Failed to apply clip mask');
                      }
                    } else {
                      console.warn('No path element found for drawing:', drawing.id);
                      
                      // Try to find all SVG paths in the document
                      const allPaths = document.querySelectorAll('svg path');
                      console.log('All SVG paths found in document:', allPaths.length);
                      allPaths.forEach((path, index) => {
                        console.log(`Path ${index}:`, {
                          hasDrawingId: path.getAttribute('data-drawing-id'),
                          id: path.id,
                          classList: Array.from(path.classList)
                        });
                      });
                    }
                  }, 500);
                }
                
                // Trigger a custom event to ensure clip masks are applied
                console.log('Dispatching floorPlanUpdated event');
                window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
                  detail: { drawingId: drawing.id }
                }));
              } else {
                console.error('Failed to save floor plan to storage');
                // Revert UI state if save failed
                setSelectedImage(null);
                setIsPdf(false);
                setFileName('');
                toast.error('Failed to save floor plan. Please try a smaller file.');
              }
            } catch (saveError) {
              console.error('Error during floor plan save:', saveError);
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
        console.error('FileReader error occurred');
        toast.error('Failed to read uploaded file');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
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
