
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface UploadButtonProps {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

const UploadButton = ({ onClick, className = '' }: UploadButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent the click event from bubbling up to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    // Call the onClick handler passed as prop
    onClick(e);
  };

  return (
    <Button 
      onClick={handleClick}
      size="sm"
      className={`bg-green-600 hover:bg-green-700 rounded-full p-1 h-8 w-8 ${className}`}
      aria-label="Upload floor plan"
    >
      <Upload className="h-4 w-4" />
    </Button>
  );
};

export default UploadButton;
