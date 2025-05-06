
import React from 'react';
import FileUploadInput from './FileUploadInput';

interface FileUploadHandlerProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
  fileInputRef,
  onChange
}) => {
  return (
    <FileUploadInput ref={fileInputRef} onChange={onChange} />
  );
};

export default FileUploadHandler;
