
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const SidebarHeader = () => {
  const { toggleSidebar, state } = useSidebar();

  const handleToggleClick = () => {
    console.log("Toggle sidebar clicked, current state:", state);
    toggleSidebar();
  };

  return (
    <div className={cn(
      "p-4 border-b flex items-center transition-all duration-300 relative",
      state === "expanded" ? "justify-between" : "justify-center"
    )}>
      <div className="flex items-center flex-1">
        <div className={cn(
          "transition-opacity duration-300 flex-1",
          state === "expanded" ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <h1 className="text-2xl font-bold">GeoSpatial Explorer</h1>
          <p className="text-muted-foreground">Search, navigate and mark locations</p>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleToggleClick}
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        {state === "expanded" ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  );
};

export default SidebarHeader;
