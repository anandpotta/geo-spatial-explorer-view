
import React from 'react';
import { GeoSpatialExplorerProps } from '../core/types';

interface NativeProps extends GeoSpatialExplorerProps {
  style?: any;
}

export const GeoSpatialExplorerNative: React.FC<NativeProps> = ({
  selectedLocation,
  onLocationSelect,
  onMapReady,
  style
}) => {
  React.useEffect(() => {
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);

  return React.createElement('div', {
    style: { 
      width: 300, 
      height: 200, 
      backgroundColor: '#e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style 
    }
  }, 'React Native Map Placeholder');
};
