
import { toast } from "sonner";

/**
 * Creates an HTMLImageElement from a blob or file
 */
export const createImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Applies a mask to an image using a SVG path
 */
export const applyPathMaskToImage = (
  img: HTMLImageElement, 
  pathData: string,
  rotation: number = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas elements
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas dimensions
      const maxSize = 1000; // Limit size for performance
      const aspectRatio = img.width / img.height;
      let width, height;
      
      if (img.width > img.height) {
        width = Math.min(img.width, maxSize);
        height = width / aspectRatio;
      } else {
        height = Math.min(img.height, maxSize);
        width = height * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Create SVG with path for clipping
      const svgString = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <path d="${pathData}" fill="black" />
        </svg>
      `;
      
      // Convert SVG to image for clipping
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const svgImg = new Image();
      
      svgImg.onload = () => {
        // Set up clipping
        ctx.save();
        
        // Draw the path as mask
        ctx.drawImage(svgImg, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-in';
        
        // Apply rotation
        if (rotation !== 0) {
          ctx.save();
          ctx.translate(width/2, height/2);
          ctx.rotate(rotation * Math.PI/180);
          ctx.drawImage(img, -width/2, -height/2, width, height);
          ctx.restore();
        } else {
          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        ctx.restore();
        
        // Get the result as data URL
        const dataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(svgUrl);
        resolve(dataUrl);
      };
      
      svgImg.onerror = (e) => {
        URL.revokeObjectURL(svgUrl);
        reject(e);
      };
      
      svgImg.src = svgUrl;
    } catch (err) {
      console.error('Error applying mask to image:', err);
      reject(err);
    }
  });
};
