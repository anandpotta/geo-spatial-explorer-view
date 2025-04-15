
import { toast } from '@/components/ui/use-toast';
import { apiCall, getConnectionStatus, checkBackendAvailability } from '@/utils/api-service';

export async function syncLocalDataWithBackend(): Promise<void> {
  const { isOnline, isBackendAvailable } = getConnectionStatus();
  if (!isOnline || !isBackendAvailable) return;
  
  try {
    // Get all local data
    const markersJson = localStorage.getItem('savedMarkers');
    const drawingsJson = localStorage.getItem('savedDrawings');
    
    // Sync markers
    if (markersJson) {
      const markers = JSON.parse(markersJson);
      await apiCall('markers/sync', {
        method: 'POST',
        body: JSON.stringify(markers),
      });
    }
    
    // Sync drawings
    if (drawingsJson) {
      const drawings = JSON.parse(drawingsJson);
      await apiCall('drawings/sync', {
        method: 'POST',
        body: JSON.stringify(drawings),
      });
    }
    
    console.log('All local data synced with backend');
  } catch (error) {
    console.error('Error syncing local data with backend:', error);
    toast({
      variant: "destructive",
      title: "Sync failed",
      description: "Could not sync local data with the server",
    });
  }
}

// Re-export for use by other components
export { checkBackendAvailability };
