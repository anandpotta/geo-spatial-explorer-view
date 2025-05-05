
import React from 'react';
import FileUploadInput from './FileUploadInput';
import { useFileUploadHandling } from '@/hooks/useFileUploadHandling';

interface FileUploadHandlerProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

const FileUploadHandler = ({ 
  fileInputRef, 
  onUploadToDrawing 
}: FileUploadHandlerProps) => {
  const {
    handleFileChange
  } = useFileUploadHandling({ onUploadToDrawing });

  return (
    <FileUploadInput ref={fileInputRef} onChange={handleFileChange} />
  );
};

export default FileUploadHandler;
