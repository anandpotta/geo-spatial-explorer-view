
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FloorPlanUploadSectionProps {
  onSelectFile: () => void;
}

const FloorPlanUploadSection = ({ onSelectFile }: FloorPlanUploadSectionProps) => {
  return (
    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
      <div className="flex flex-col items-center gap-4">
        <Upload className="h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-medium">Upload Floor Plan</h3>
        <p className="text-gray-600 text-center max-w-md">
          Click the Upload Floor Plan button above to add a floor plan image or PDF
        </p>
        <Button onClick={onSelectFile}>
          <Upload className="mr-2 h-4 w-4" />
          Select File
        </Button>
      </div>
    </div>
  );
};

export default FloorPlanUploadSection;
