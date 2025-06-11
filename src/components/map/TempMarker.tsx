
import React, { useRef, useEffect, useState } from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import NewMarkerForm from './NewMarkerForm';

interface TempMarkerProps {
  position: [number, number];
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
}

const TempMarker: React.FC<TempMarkerProps> = ({
  position,
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const [markerReady, setMarkerReady] = useState(false);
  const [markerUid] = useState(() => crypto.randomUUID());
  const [imageUid] = useState(() => crypto.randomUUID());
  const [iconUid] = useState(() => crypto.randomUUID());
  const markerId = `temp-marker-${markerUid}`;

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          // Safely close any open UI elements
          markerRef.current.closeTooltip();
          markerRef.current.closePopup();
          
          // Clean up any DOM elements using UID
          const tempIcons = document.querySelectorAll(`[data-marker-uid="${markerUid}"]`);
          tempIcons.forEach(icon => {
            if (icon.parentNode) {
              icon.parentNode.removeChild(icon);
            }
          });
          
          // Also clean up marker image elements
          const tempImages = document.querySelectorAll(`[data-image-uid="${imageUid}"]`);
          tempImages.forEach(img => {
            if (img.parentNode) {
              img.parentNode.removeChild(img);
            }
          });

          // Clean up leaflet-marker-icon elements
          const tempMarkerIcons = document.querySelectorAll(`[data-icon-uid="${iconUid}"]`);
          tempMarkerIcons.forEach(icon => {
            if (icon.parentNode) {
              icon.parentNode.removeChild(icon);
            }
          });
        } catch (error) {
          console.error("Error cleaning up temp marker:", error);
        }
      }
    };
  }, [markerUid, imageUid, iconUid]);

  // Update marker position in parent when dragged
  const handleDragEnd = (e: L.LeafletEvent) => {
    const marker = e.target;
    if (marker && marker.getLatLng) {
      const position = marker.getLatLng();
      // Update the position through the global handler if available
      if (window.tempMarkerPositionUpdate) {
        window.tempMarkerPositionUpdate([position.lat, position.lng]);
        console.log("Marker position updated:", [position.lat, position.lng]);
      }
    }
  };
  
  // Custom save handler to ensure cleanup before saving
  const handleSave = () => {
    // Clean up the marker DOM elements before saving using UID
    const tempIcons = document.querySelectorAll(`[data-marker-uid="${markerUid}"]`);
    tempIcons.forEach(icon => {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon);
      }
    });
    
    // Clean up marker image elements
    const tempImages = document.querySelectorAll(`[data-image-uid="${imageUid}"]`);
    tempImages.forEach(img => {
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
    
    // Clean up leaflet-marker-icon elements
    const tempMarkerIcons = document.querySelectorAll(`[data-icon-uid="${iconUid}"]`);
    tempMarkerIcons.forEach(icon => {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon);
      }
    });
    
    // Call the original save handler
    onSave();
  };

  // Set up marker references with UID
  const setMarkerInstance = (marker: L.Marker) => {
    if (marker) {
      markerRef.current = marker;
      
      // Add UID attributes for easy identification
      const element = marker.getElement();
      if (element) {
        element.setAttribute('data-marker-id', markerId);
        element.setAttribute('data-marker-uid', markerUid);
        element.setAttribute('data-marker-type', 'temp');
        element.id = `marker-${markerUid}`;
        
        // Add UID to the leaflet-marker-icon element
        if (element.classList.contains('leaflet-marker-icon')) {
          element.setAttribute('data-icon-uid', iconUid);
          element.setAttribute('data-marker-icon-id', markerId);
          element.setAttribute('data-marker-type', 'temp');
          element.id = `marker-icon-${iconUid}`;
          console.log(`Temp marker icon configured with UID: ${iconUid}`);
        }
        
        // Add UID to the marker image element
        const imgElement = element.querySelector('img');
        if (imgElement) {
          imgElement.setAttribute('data-image-uid', imageUid);
          imgElement.setAttribute('data-marker-image-id', markerId);
          imgElement.setAttribute('data-image-type', 'marker-icon');
          imgElement.setAttribute('data-marker-img-uid', imageUid);
          imgElement.id = `marker-image-${imageUid}`;
          console.log(`Temp marker image configured with UID: ${imageUid}`);
        }
      }
      
      // Also add UID to shadow element if it exists
      const shadowElement = element?.nextElementSibling;
      if (shadowElement && shadowElement.classList.contains('leaflet-marker-shadow')) {
        shadowElement.setAttribute('data-marker-uid', markerUid);
        shadowElement.setAttribute('data-shadow-for', markerUid);
        shadowElement.setAttribute('data-image-uid', `${imageUid}-shadow`);
        shadowElement.id = `marker-shadow-${markerUid}`;
      }
      
      setMarkerReady(true);
      console.log(`Temp marker created with UIDs: marker=${markerUid}, image=${imageUid}, icon=${iconUid}`);
    }
  };

  return (
    <Marker
      position={position}
      ref={setMarkerInstance}
      draggable={true}
      eventHandlers={{
        dragend: handleDragEnd,
        add: () => {
          // Wait for marker to be added to DOM before showing popup
          setTimeout(() => {
            try {
              if (markerRef.current) {
                markerRef.current.openPopup();
              }
            } catch (error) {
              console.error("Error opening popup:", error);
            }
          }, 100);
        }
      }}
    >
      <NewMarkerForm
        markerName={markerName}
        setMarkerName={setMarkerName}
        markerType={markerType}
        setMarkerType={setMarkerType}
        onSave={handleSave}
      />
      <Tooltip
        direction="top"
        offset={[0, -10]}
        opacity={0.9}
        permanent={true}
      >
        <span className="font-medium">{markerName || 'New Location'}</span>
      </Tooltip>
    </Marker>
  );
};

export default TempMarker;
