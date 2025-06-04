
import React, { useCallback, useRef, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/geo-utils';
import { useUserMarkerActions } from '@/hooks/useUserMarkerActions';
import { useUserMarkerState } from '@/hooks/useUserMarkerState';
import UserMarkerPopup from './UserMarkerPopup';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const UserMarker = ({ marker, onDelete }: UserMarkerProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  
  const {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    isPinned,
    setIsPinned,
    startEditing,
    cancelEditing
  } = useUserMarkerState(marker.name, marker.isPinned || false);

  const {
    handleDragEnd,
    handleRename,
    handlePinToggle,
    handleDelete,
    isDeleting
  } = useUserMarkerActions({ marker, onDelete });

  const onRename = useCallback((newName: string) => {
    handleRename(newName);
    setIsEditing(false);
  }, [handleRename, setIsEditing]);

  const onPinToggle = useCallback(() => {
    const newPinState = handlePinToggle(isPinned);
    setIsPinned(newPinState);
  }, [handlePinToggle, isPinned, setIsPinned]);

  const onDeleteClick = useCallback(() => {
    if (markerRef.current) {
      try {
        markerRef.current.closePopup();
      } catch (e) {
        console.error('Error cleaning up marker before deletion:', e);
      }
    }
    handleDelete();
  }, [handleDelete]);

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
      <UserMarkerPopup
        markerName={marker.name}
        isEditing={isEditing}
        editName={editName}
        setEditName={setEditName}
        isPinned={isPinned}
        isDeleting={isDeleting}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onRename={onRename}
        onPinToggle={onPinToggle}
        onDelete={onDeleteClick}
      />
    </Marker>
  );
};

export default React.memo(UserMarker);
