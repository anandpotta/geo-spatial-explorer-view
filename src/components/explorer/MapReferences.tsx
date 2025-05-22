
import { useRef } from 'react';

interface MapReferencesProps {
  onCesiumViewerRef: (viewer: any) => void;
  onLeafletMapRef: (map: any) => void;
}

const MapReferences: React.FC<MapReferencesProps> = ({ 
  onCesiumViewerRef, 
  onLeafletMapRef 
}) => {
  const cesiumViewerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);

  const handleCesiumViewerRef = (viewer: any) => {
    cesiumViewerRef.current = viewer;
    onCesiumViewerRef(viewer);
  };

  const handleLeafletMapRef = (map: any) => {
    leafletMapRef.current = map;
    onLeafletMapRef(map);
  };

  return null; // This component doesn't render anything, it just manages refs
};

export default MapReferences;
