
import { useState, useEffect } from 'react';
import { Location, searchLocations } from '@/utils/geo-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, X } from 'lucide-react';

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 3) {
        setIsLoading(true);
        const locations = await searchLocations(query);
        setResults(locations);
        setIsLoading(false);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (location: Location) => {
    console.log('Location selected in search component:', location);
    setSelectedLocation(location);
    setQuery(location.label);
    onLocationSelect(location);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLocation(null);
    setResults([]);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      console.log('Submitting selected location:', selectedLocation);
      onLocationSelect(selectedLocation);
    } else if (results.length > 0) {
      console.log('Submitting first result:', results[0]);
      handleSelect(results[0]);
    }
  };

  return (
    <div className="map-search-panel p-3 z-10 absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-sm shadow-md">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search for a building address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-8 pl-10"
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
          <Button type="submit" size="icon" variant="default">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </Button>
        </div>
        
        {showResults && results.length > 0 && (
          <ul className="absolute z-10 w-full bg-card border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
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
