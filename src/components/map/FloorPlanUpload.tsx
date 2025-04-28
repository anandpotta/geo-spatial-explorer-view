
import { Button } from '@/components/ui/button';
import { FlipHorizontal, Upload } from 'lucide-react';

interface FloorPlanUploadProps {
  onBack: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: string | null;
}

const FloorPlanUpload = ({ onBack, onFileSelect, selectedImage }: FloorPlanUploadProps) => {
  return (
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
          onChange={onFileSelect}
        />
        <Button
          variant="outline"
          className="bg-white/80 backdrop-blur-sm"
          type="button"
          onClick={() => {
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.click();
          }}
        >
          <Upload className="mr-2 h-4 w-4" />
          {selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
        </Button>
      </label>
    </div>
  );
};

export default FloorPlanUpload;
