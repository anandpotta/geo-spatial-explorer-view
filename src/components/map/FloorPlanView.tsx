import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
      if (savedFloorPlans[drawing.id]) {
        const savedData = savedFloorPlans[drawing.id];
        setSelectedImage(savedData.data);
        setIsPdf(savedData.isPdf);
        setFileName(savedData.fileName);
      }
    }
  }, [drawing]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    // Save file name and check if it's a PDF
    setFileName(file.name);
    setIsPdf(file.type.includes('pdf'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const dataUrl = result as string;
        setSelectedImage(dataUrl);
        
        // Save to localStorage for this specific building
        if (drawing?.id) {
          const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          savedFloorPlans[drawing.id] = {
            data: dataUrl,
            isPdf: file.type.includes('pdf'),
            fileName: file.name,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
          toast.success('Floor plan uploaded successfully');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white/80 backdrop-blur-sm"
        >
          <FlipHorizontal className="mr-2 h-4 w-4" />
          Back to Map
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm"
            type="button"
            onClick={() => {
              // This will trigger the file input click
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
          </Button>
        </label>
      </div>
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        {selectedImage ? (
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
              />
            )}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium">Upload Floor Plan</h3>
              <p className="text-gray-600 text-center max-w-md">
                Click the Upload Floor Plan button above to add a floor plan image or PDF
              </p>
              <Button 
                onClick={() => {
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (fileInput) fileInput.click();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
