
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MapPin, Trash2 } from "lucide-react";
import { LocationMarker } from "@/utils/marker-utils";

interface MarkerMenuItemProps {
  marker: LocationMarker;
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
}

const MarkerMenuItem = ({ marker, onSelect, onDelete }: MarkerMenuItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleSelect = (e: React.MouseEvent) => {
    // Don't select if we're trying to delete
    if (isDeleting) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    console.log("Marker selected:", marker.name, marker.position);
    onSelect(marker.position);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    setIsDeleting(true);
    e.stopPropagation();
    e.preventDefault();
    
    // Add a tiny delay to ensure the event doesn't propagate
    setTimeout(() => {
      onDelete(marker.id, e);
      setIsDeleting(false);
    }, 10);
  };

  return (
    <DropdownMenuItem 
      className="flex justify-between items-center" 
      onSelect={(e) => e.preventDefault()}
    >
      <div
        className="flex items-center flex-1 cursor-pointer"
        onClick={handleSelect}
      >
        <MapPin className="mr-2 h-4 w-4" />
        {marker.name}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleDelete}
        tabIndex={0}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete {marker.name}</span>
      </Button>
    </DropdownMenuItem>
  );
};

export default MarkerMenuItem;
