
import { useState } from "react";
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
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      toast.success('Floor plan uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-50 flex gap-2">
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
          >
            <Upload className="mr-2 h-4 w-4" />
            {selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
          </Button>
        </label>
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white/80 backdrop-blur-sm"
        >
          <FlipHorizontal className="mr-2 h-4 w-4" />
          Back to Map
        </Button>
      </div>
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        {selectedImage ? (
          <div className="space-y-4 text-center max-w-[90%]">
            <h2 className="text-xl font-semibold">
              {drawing?.properties?.name || 'Floor Plan View'}
            </h2>
            <img
              src={selectedImage}
              alt="Floor Plan"
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium">Upload Floor Plan</h3>
              <p className="text-gray-600 text-center max-w-md">
                Click the Upload Floor Plan button above to add a floor plan image or PDF
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                />
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
