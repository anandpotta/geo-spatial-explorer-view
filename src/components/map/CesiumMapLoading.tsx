
import React from 'react';
import { Loader2, Globe, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface CesiumMapLoadingProps {
  isLoading: boolean;
  mapError: string | null;
}

const CesiumMapLoading = ({ isLoading, mapError }: CesiumMapLoadingProps) => {
  // If there's an error loading the map, display an error message
  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-6 max-w-md">
          <div className="flex justify-center mb-4">
            <AlertTriangle size={48} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Cesium Map Error</h3>
          <Alert variant="destructive" className="my-3">
            <AlertTitle>Access Error</AlertTitle>
            <AlertDescription>
              {mapError}
            </AlertDescription>
          </Alert>
          <p className="text-sm mt-4">Falling back to 2D map view...</p>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Globe size={48} className="text-blue-400" />
              <Loader2 size={64} className="animate-spin text-white absolute -top-2 -left-2 opacity-70" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Loading 3D Globe</h3>
          <p className="mb-2">Please wait while we initialize the map...</p>
          <p className="text-xs text-slate-400">This may take a few moments depending on your connection.</p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default CesiumMapLoading;
