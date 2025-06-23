
// Simplified hook for library distribution - no external dependencies
export function useDrawingFileUpload() {
  const handleUploadToDrawing = (drawingId: string, file: File) => {
    console.log(`Processing upload for drawing ${drawingId}, file: ${file.name}`);
    
    // Basic file validation
    const fileType = file.type;
    
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      console.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.error('File size should be less than 10MB');
      return;
    }
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        console.log(`File read complete for ${file.name}`);
        
        // Return the file data for the consuming application to handle
        const fileData = {
          drawingId,
          data: e.target.result as string,
          isPdf: fileType === 'application/pdf',
          fileName: file.name
        };
        
        // Dispatch custom event for the consuming application to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('geoDrawingFileUploaded', { 
            detail: fileData 
          }));
        }
        
        console.log(`File processed for drawing ${drawingId}`);
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
    };
    
    reader.readAsDataURL(file);
  };
  
  return { handleUploadToDrawing };
}
