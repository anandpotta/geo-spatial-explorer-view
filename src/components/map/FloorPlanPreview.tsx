
import { useRef } from 'react';
import { ImageTransformation } from '@/utils/image-transform-utils';

interface FloorPlanPreviewProps {
  selectedImage: string;
  isPdf: boolean;
  fileName: string;
  title: string;
  containerRef: React.RefObject<HTMLDivElement>;
  imageRef: React.RefObject<HTMLImageElement>;
  isDragging: boolean;
  transformation: ImageTransformation;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const FloorPlanPreview = ({
  selectedImage,
  isPdf,
  fileName,
  title,
  containerRef,
  imageRef,
  isDragging,
  transformation,
  onMouseDown,
  onMouseMove
}: FloorPlanPreviewProps) => {
  return (
    <div className="space-y-4 text-center max-w-[90%]">
      <h2 className="text-xl font-semibold">
        {title}
        {fileName && <span className="text-sm font-normal ml-2 text-gray-500">({fileName})</span>}
      </h2>
      
      {isPdf ? (
        <div className="w-full max-h-[75vh] overflow-hidden rounded-lg shadow-lg border border-gray-200">
          <iframe 
            src={selectedImage} 
            className="w-full h-[70vh]" 
            title="PDF Floor Plan"
          />
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="max-h-[70vh] max-w-full overflow-hidden rounded-lg shadow-lg border border-gray-200 bg-gray-50 relative"
          style={{
            width: "90%",
            height: "70vh",
            margin: "0 auto"
          }}
        >
          <div
            className={`absolute cursor-${isDragging ? 'grabbing' : 'grab'}`}
            style={{
              transform: `translate(${transformation.position.x}px, ${transformation.position.y}px) rotate(${transformation.rotation}deg) scale(${transformation.scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
          >
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Floor Plan"
              className="max-h-[70vh] max-w-full object-contain"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanPreview;
