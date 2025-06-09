import { useState, useEffect, useRef } from 'react';
import { Location, searchLocations } from '@/utils/location-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X, Navigation, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const { toast } = useToast();
  
  // Add refs to prevent multiple simultaneous operations
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');
  const isSearchingRef = useRef(false);

  useEffect(() => {
    // Check if we're online or offline
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

  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 3 && query !== lastSearchRef.current && !isSearchingRef.current) {
      searchTimeoutRef.current = setTimeout(async () => {
        if (isSearchingRef.current) return; // Prevent concurrent searches
        
        isSearchingRef.current = true;
        lastSearchRef.current = query;
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
          isSearchingRef.current = false;
        }
      }, 500);
    } else if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      lastSearchRef.current = '';
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, isOfflineMode, toast]);

  const handleSelect = (location: Location) => {
    console.log('Location selected in search component:', location);
    setSelectedLocation(location);
    setQuery(location.label);
    setShowResults(false);
    
    toast({
      title: "Starting navigation",
      description: `Traveling to ${location.label}`,
      duration: 3000,
    });
    
    // Use setTimeout to prevent immediate state conflicts
    setTimeout(() => {
      onLocationSelect(location);
    }, 100);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setResults([]);
    setShowResults(false);
    lastSearchRef.current = '';
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearchingRef.current) return; // Prevent submission during search
    
    if (selectedLocation) {
      setTimeout(() => {
        onLocationSelect(selectedLocation);
      }, 100);
      
      toast({
        title: "Starting navigation",
        description: `Traveling to ${selectedLocation.label}`,
        duration: 3000,
      });
    } else if (results.length > 0) {
      handleSelect(results[0]);
    } else if (query.length >= 3) {
      if (isSearchingRef.current) return;
      
      isSearchingRef.current = true;
      setIsLoading(true);
      
      searchLocations(query).then(locations => {
        setIsLoading(false);
        isSearchingRef.current = false;
        
        if (locations.length > 0) {
          handleSelect(locations[0]);
        } else {
          toast({
            title: "No locations found",
            description: "Try entering a more specific address",
            variant: "destructive"
          });
        }
      }).catch(error => {
        setIsLoading(false);
        isSearchingRef.current = false;
        toast({
          title: "Search error",
          description: "Could not complete the search request",
          variant: "destructive",
          duration: 3000,
        });
      });
    }
  };

  return (
    <div className="w-full p-2 z-[10000] bg-background rounded-md shadow-lg">
      {isOfflineMode && (
        <div className="mb-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm flex items-center rounded">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>Working in offline mode. Limited search results available.</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter location to navigate..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-8 pl-10 w-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            {query && (
              <button 
                type="button" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Button type="submit" size="icon" variant="default" disabled={isLoading || isSearchingRef.current}>
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
          </Button>
        </div>
        
        {showResults && results.length > 0 && (
          <ul className="absolute z-50 w-full bg-card border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
            {results.map((location) => (
              <li 
                key={location.id} 
                className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center"
                onClick={() => handleSelect(location)}
              >
                <Search size={14} className="mr-2 text-muted-foreground" />
                {location.label}
              </li>
            ))}
          </ul>
        )}
      </form>
      
      {selectedLocation && (
        <div className="mt-3 p-3 bg-accent rounded-md">
          <h3 className="font-medium">{selectedLocation.label}</h3>
          <p className="text-sm text-muted-foreground">
            Lat: {selectedLocation.y.toFixed(6)}, Lng: {selectedLocation.x.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
