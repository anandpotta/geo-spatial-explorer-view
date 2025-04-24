
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const SidebarHeader = () => {
  const { toggleSidebar } = useSidebar();

  // Handle the button click to toggle sidebar
  const handleToggleClick = () => {
    console.log("Toggle sidebar clicked");
    toggleSidebar();
  };

  return (
    <div className="p-4 border-b flex justify-between items-center">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleToggleClick}
          className="mr-2"
        >
          <Menu size={24} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">GeoSpatial Explorer</h1>
          <p className="text-muted-foreground">Search, navigate and mark locations</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
