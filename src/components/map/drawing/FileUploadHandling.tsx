
import { RefObject } from 'react';
import FileUploadInput from './FileUploadInput';

interface FileUploadHandlingProps {
  fileInputRef: RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadHandling = ({ fileInputRef, onChange }: FileUploadHandlingProps) => {
  return (
    <FileUploadInput ref={fileInputRef} onChange={onChange} />
  );
};

export default FileUploadHandling;
