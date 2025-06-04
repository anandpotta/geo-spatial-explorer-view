
import { useState } from 'react';

export const useUserMarkerState = (markerName: string, initialPinState: boolean) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(markerName);
  const [isPinned, setIsPinned] = useState(initialPinState);

  const startEditing = () => {
    setIsEditing(true);
    setEditName(markerName);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(markerName);
  };

  return {
    isEditing,
    setIsEditing,
    editName,
    setEditName,
    isPinned,
    setIsPinned,
    startEditing,
    cancelEditing
  };
};
