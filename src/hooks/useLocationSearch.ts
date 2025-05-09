
import { useState, useEffect } from 'react';
import { Location, searchLocations } from '@/utils/location-utils';
import { useToast } from '@/components/ui/use-toast';

export const useLocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();

  // Check online/offline status
  useEffect(() => {
    setIsOfflineMode(!navigator.onLine);
    
    const handleOnlineStatusChange = () => {
      setIsOfflineMode(!navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Handle search query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoading(true);
        try {
          const locations = await searchLocations(query);
          setResults(locations);
          setShowResults(true);
          
          if (locations.length === 0) {
            toast({
              title: "No results found",
              description: "Try a different search term",
              duration: 3000,
            });
          }
          
          if (isOfflineMode && locations.length > 0) {
            toast({
              title: "Using offline data",
              description: "Limited locations are available in offline mode",
              duration: 3000,
            });
          }
        } catch (error) {
          console.error("Error during search:", error);
          toast({
            title: "Search error",
            description: "Could not complete the search request",
            variant: "destructive",
            duration: 3000,
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOfflineMode, toast]);

  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setResults([]);
    setShowResults(false);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    selectedLocation,
    setSelectedLocation,
    showResults,
    setShowResults,
    isOfflineMode,
    handleClear
  };
};
