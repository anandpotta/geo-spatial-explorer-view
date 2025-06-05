
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Edit2 } from 'lucide-react';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
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
    // Focus on input when component mounts
    const timer = setTimeout(() => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [disabled]);

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) {
      console.log('Save button disabled, ignoring click');
      return;
    }
    
    console.log('NewMarkerForm: Save button clicked');
    
    if (isEditing && existingMarkerId && onRename) {
      console.log('NewMarkerForm: Renaming marker');
      onRename(existingMarkerId, markerName);
    } else {
      console.log('NewMarkerForm: Saving new marker');
      onSave();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && markerName.trim() && !disabled) {
      e.preventDefault();
      e.stopPropagation();
      handleSaveButtonClick(e as any);
    }
  };

  return (
    <div className="p-3 min-w-[250px]" onClick={(e) => e.stopPropagation()}>
      <Input 
        ref={inputRef}
        type="text"
        placeholder="Location name"
        value={markerName}
        onChange={(e) => setMarkerName(e.target.value)}
        onKeyPress={handleKeyPress}
        className="mb-3"
        disabled={disabled}
      />
      {!isEditing && (
        <div className="flex gap-1 mb-3">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => setMarkerType('pin')}
            disabled={disabled}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => setMarkerType('area')}
            disabled={disabled}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => setMarkerType('building')}
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
        {disabled ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : isEditing ? (
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
