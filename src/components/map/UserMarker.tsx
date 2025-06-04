
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, MapPinOff, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(marker.name);
  const [isPinned, setIsPinned] = useState(marker.isPinned || false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDragEnd = useCallback((e: L.LeafletEvent) => {
    if (!markerRef.current || isDeleting) return;
    
    try {
      const updatedMarker = e.target;
      const newPosition = updatedMarker.getLatLng();
      
      // Update marker position in local storage
      const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
      const updatedMarkers = savedMarkers.map((m: LocationMarker) => {
        if (m.id === marker.id) {
          return {
            ...m,
            position: [newPosition.lat, newPosition.lng] as [number, number]
          };
        }
        return m;
      });
      
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      window.dispatchEvent(new CustomEvent('markersUpdated'));
      
    } catch (error) {
      console.error('Error updating marker position:', error);
    }
  }, [marker.id, isDeleting]);

  const handleRename = () => {
    if (editName.trim() && editName !== marker.name) {
      // Update marker name in localStorage
      const savedMarkers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
      const updatedMarkers = savedMarkers.map((m: LocationMarker) => 
        m.id === marker.id ? { ...m, name: editName.trim() } : m
      );
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      window.dispatchEvent(new CustomEvent('markersUpdated'));
      toast.success('Location renamed successfully');
    }
    setIsEditing(false);
  };

  const handlePinToggle = () => {
    const updatedPinnedState = !isPinned;
    setIsPinned(updatedPinnedState);
    
    // Update the marker in localStorage
    const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = markers.map((m: LocationMarker) => 
      m.id === marker.id ? { ...m, isPinned: updatedPinnedState } : m
    );
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    window.dispatchEvent(new CustomEvent('markersUpdated'));
    
    toast.success(updatedPinnedState ? 'Location pinned' : 'Location unpinned');
  };

  const handleDelete = useCallback(() => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    if (markerRef.current) {
      try {
        markerRef.current.closePopup();
      } catch (e) {
        console.error('Error cleaning up marker before deletion:', e);
      }
    }
    
    onDelete(marker.id);
    toast.success('Location deleted');
  }, [onDelete, marker.id, isDeleting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.closePopup();
        } catch (error) {
          console.error('Error cleaning up marker:', error);
        }
      }
    };
  }, []);

  return (
    <Marker 
      position={marker.position} 
      draggable={true}
      ref={(markerInstance) => {
        markerRef.current = markerInstance;
      }}
      eventHandlers={{ 
        dragend: handleDragEnd 
      }}
    >
      <Popup closeOnClick={false} autoClose={false} maxWidth={300} minWidth={250}>
        <div className="p-2" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Location name"
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleRename}
                  disabled={!editName.trim()}
                  className="flex-1"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(marker.name);
                  }}
                  className="flex-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">{marker.name}</h3>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1"
                >
                  <Edit2 size={12} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePinToggle}
                  className="flex items-center gap-1"
                >
                  {isPinned ? (
                    <>
                      <MapPinOff size={12} />
                      Unpin
                    </>
                  ) : (
                    <>
                      <MapPin size={12} />
                      Pin
                    </>
                  )}
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="w-full flex items-center gap-1"
                disabled={isDeleting}
              >
                <Trash2 size={12} />
                Delete Location
              </Button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(UserMarker);
