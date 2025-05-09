
import { useState } from 'react';
import { Location } from '@/utils/location-utils';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import OfflineBanner from './search/OfflineBanner';
import SearchInput from './search/SearchInput';
import SearchResults from './search/SearchResults';
import SelectedLocation from './search/SelectedLocation';

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
}

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const { 
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
  } = useLocationSearch();
  
  const { toast } = useToast();

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
    
    onLocationSelect(location);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      
      toast({
        title: "Starting navigation",
        description: `Traveling to ${selectedLocation.label}`,
        duration: 3000,
      });
    } else if (results.length > 0) {
      handleSelect(results[0]);
    } else if (query.length >= 3) {
      setIsLoading(true);
      searchLocations(query).then(locations => {
        setIsLoading(false);
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
        toast({
          title: "Search error",
          description: "Could not complete the search request",
          variant: "destructive",
          duration: 3000,
        });
      });
    }
  };

  const handleFocusInput = () => {
    // Show results again when user focuses on the input field
    if (query.length >= 3 && results.length > 0) {
      setShowResults(true);
    }
  };

  // We need to import searchLocations for the submit handler
  const { searchLocations } = require('@/utils/location-utils');

  return (
    <div className="w-full p-2 z-[10000] bg-background rounded-md shadow-lg">
      <OfflineBanner isVisible={isOfflineMode} />
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <SearchInput
            query={query}
            onChange={setQuery}
            onClear={handleClear}
            isLoading={isLoading}
            onFocus={handleFocusInput}
          />
          
          <Button type="submit" size="icon" variant="default">
            <Navigation size={18} />
          </Button>
        </div>
        
        <SearchResults 
          results={results}
          show={showResults}
          onSelect={handleSelect}
        />
      </form>
      
      <SelectedLocation location={selectedLocation} />
    </div>
  );
};

export default LocationSearch;
