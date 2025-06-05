
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Edit2 } from 'lucide-react';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: (e?: React.MouseEvent) => void;
  isEditing?: boolean;
  existingMarkerId?: string;
  onRename?: (id: string, newName: string) => void;
  disabled?: boolean;
}

const NewMarkerForm = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isEditing = false,
  existingMarkerId,
  onRename,
  disabled = false
}: NewMarkerFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!disabled) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !markerName.trim()) return;
    
    if (isEditing && existingMarkerId && onRename) {
      onRename(existingMarkerId, markerName);
    } else {
      onSave(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setMarkerName(e.target.value);
  };

  const handleTypeButtonClick = (type: 'pin' | 'area' | 'building') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setMarkerType(type);
    }
  };

  const handleFormClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && markerName.trim() && !disabled) {
      e.preventDefault();
      e.stopPropagation();
      if (isEditing && existingMarkerId && onRename) {
        onRename(existingMarkerId, markerName);
      } else {
        onSave();
      }
    }
  };

  return (
    <div className="p-3" onClick={handleFormClick}>
      <Input 
        ref={inputRef}
        type="text"
        placeholder="Enter location name"
        value={markerName}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="mb-3"
        disabled={disabled}
        autoFocus
      />
      {!isEditing && (
        <div className="flex mb-3 gap-1">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={handleTypeButtonClick('pin')}
            disabled={disabled}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={handleTypeButtonClick('area')}
            disabled={disabled}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={handleTypeButtonClick('building')}
            disabled={disabled}
          >
            Building
          </Button>
        </div>
      )}
      <Button 
        onClick={handleSaveButtonClick}
        disabled={!markerName.trim() || disabled}
        className="w-full"
        size="sm"
      >
        {isEditing ? (
          <>
            <Edit2 className="h-4 w-4 mr-2" />
            Rename Location
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Location
          </>
        )}
      </Button>
    </div>
  );
};

export default NewMarkerForm;
