
import { forwardRef } from 'react';

interface FileUploadInputProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadInput = forwardRef<HTMLInputElement, FileUploadInputProps>(
  ({ onChange }, ref) => {
    return (
      <input
        type="file"
        ref={ref}
        style={{ display: 'none' }}
        onChange={onChange}
        accept="image/*,application/pdf"
      />
    );
  }
);

FileUploadInput.displayName = 'FileUploadInput';

export default FileUploadInput;
