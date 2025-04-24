
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const SidebarHeader = () => {
  const { toggleSidebar, state } = useSidebar();

  const handleToggleClick = () => {
    console.log("Toggle sidebar clicked, current state:", state);
    toggleSidebar();
  };

  return (
    <div className={cn(
      "p-4 border-b flex transition-all duration-300",
      state === "expanded" ? "justify-between" : "justify-center"
    )}>
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
        <div className={cn(
          "transition-opacity duration-300",
          state === "expanded" ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <h1 className="text-2xl font-bold">GeoSpatial Explorer</h1>
          <p className="text-muted-foreground">Search, navigate and mark locations</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
