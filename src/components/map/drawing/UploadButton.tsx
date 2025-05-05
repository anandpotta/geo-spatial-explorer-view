
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadButtonProps {
  onClick: () => void;
  className?: string;
}

const UploadButton = ({ onClick, className = '' }: UploadButtonProps) => {
  return (
    <Button 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }} 
      size="sm"
      className={`bg-green-600 hover:bg-green-700 rounded-full p-1 h-8 w-8 ${className}`}
    >
      <Upload className="h-4 w-4" />
    </Button>
  );
};

export default UploadButton;
