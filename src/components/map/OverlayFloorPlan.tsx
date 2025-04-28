
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { calculatePolygonFit } from '@/utils/image-transform-utils';

interface OverlayFloorPlanProps {
  drawingId: string;
  coordinates: Array<[number, number]>;
  imageUrl: string;
}

const OverlayFloorPlan = ({ drawingId, coordinates, imageUrl }: OverlayFloorPlanProps) => {
  const map = useMap();
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Load saved transformation from localStorage
  useEffect(() => {
    const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    if (savedFloorPlans[drawingId]?.transformation) {
      const t = savedFloorPlans[drawingId].transformation;
      setRotation(t.rotation || 0);
      setScale(t.scale || 1);
      
      // Position needs to be converted for map coordinates
      if (coordinates && coordinates.length > 0) {
        // Calculate center of the polygon
        let bounds = calculateBounds(coordinates);
        setPosition([
          (bounds.minLat + bounds.maxLat) / 2,
          (bounds.minLng + bounds.maxLng) / 2
        ]);
      }
    }
    setImageLoaded(true);
  }, [drawingId, coordinates]);
  
  // Calculate bounds of polygon
  const calculateBounds = (coords: Array<[number, number]>): { 
    minLat: number, minLng: number, maxLat: number, maxLng: number 
  } => {
    if (!coords || coords.length === 0) {
      return { minLat: 0, minLng: 0, maxLat: 0, maxLng: 0 };
    }
    
    return coords.reduce((acc, [lat, lng]) => ({
      minLat: Math.min(acc.minLat, lat),
      minLng: Math.min(acc.minLng, lng),
      maxLat: Math.max(acc.maxLat, lat),
      maxLng: Math.max(acc.maxLng, lng)
    }), { 
      minLat: coords[0][0], 
      minLng: coords[0][1], 
      maxLat: coords[0][0], 
      maxLng: coords[0][1] 
    });
  };
  
  // Calculate and create image overlay based on polygon
  useEffect(() => {
    if (!map || !coordinates || coordinates.length === 0 || !imageUrl || !imageLoaded) return;
    
    // Clean up previous overlay
    if (imageOverlayRef.current) {
      imageOverlayRef.current.remove();
    }
    
    // Calculate bounds
    const bounds = calculateBounds(coordinates);
    
    // Create the bounding box for the image
    const southWest = L.latLng(bounds.minLat, bounds.minLng);
    const northEast = L.latLng(bounds.maxLat, bounds.maxLng);
    const latLngBounds = L.latLngBounds(southWest, northEast);
    
    // Create a temporary image to get dimensions
    const tempImg = new Image();
    tempImg.onload = () => {
      // Create the image overlay
      const overlay = L.imageOverlay(imageUrl, latLngBounds, {
        opacity: 0.8,
        interactive: true
      }).addTo(map);
      
      imageOverlayRef.current = overlay;
      
      // Add click handler to show controls
      overlay.on('click', () => {
        setShowControls(true);
      });
      
      // Apply saved transformations if available
      applyTransformation();
    };
    tempImg.src = imageUrl;
    
    // Click outside to hide controls
    map.on('click', () => {
      setShowControls(false);
    });
    
    return () => {
      if (imageOverlayRef.current) {
        imageOverlayRef.current.remove();
      }
    };
  }, [map, coordinates, imageUrl, imageLoaded]);
  
  // Apply transformation to the image overlay
  const applyTransformation = () => {
    if (!imageOverlayRef.current || !position) return;
    
    const overlay = imageOverlayRef.current;
    const element = overlay.getElement();
    
    if (element) {
      element.style.transform = `rotate(${rotation}deg) scale(${scale})`;
      element.style.transformOrigin = 'center center';
    }
  };
  
  // Update transformation when values change
  useEffect(() => {
    applyTransformation();
    
    // Save to localStorage
    const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    if (savedFloorPlans[drawingId]) {
      savedFloorPlans[drawingId].transformation = {
        rotation,
        scale,
        position
      };
      localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
    }
  }, [rotation, scale, position, drawingId]);
  
  // Handle rotation
  const handleRotateLeft = () => {
    setRotation(prev => prev - 15);
  };
  
  const handleRotateRight = () => {
    setRotation(prev => prev + 15);
  };
  
  // Handle zoom
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.2));
  };
  
  // Handle fit to borders
  const handleFitToBorders = () => {
    if (!coordinates || coordinates.length === 0) return;
    
    // Reset rotation and scale
    setScale(1);
    setRotation(0);
    
    toast.success('Floor plan fit to shape borders');
  };
  
  // Handle reset
  const handleReset = () => {
    setRotation(0);
    setScale(1);
    toast.info('Floor plan reset');
  };
  
  if (!showControls) return null;
  
  return (
    <div className="absolute top-20 left-4 z-[1000] bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md">
      <div className="flex gap-1">
        <Button variant="outline" size="icon" onClick={handleRotateLeft} title="Rotate Left">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleRotateRight} title="Rotate Right">
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleFitToBorders} title="Fit to Borders">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs">Scale:</span>
        <Slider 
          value={[scale]} 
          min={0.2} 
          max={3} 
          step={0.05} 
          className="w-32"
          onValueChange={(values) => setScale(values[0])}
        />
        <span className="text-xs">{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
};

export default OverlayFloorPlan;
