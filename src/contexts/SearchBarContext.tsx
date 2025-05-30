import React, { createContext, useContext, useState } from 'react';

interface SearchBarContextProps {
  showSearchBar: boolean;
  setShowSearchBar: (show: boolean) => void;
}

const SearchBarContext = createContext<SearchBarContextProps | undefined>(undefined);

export const SearchBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showSearchBar, setShowSearchBar] = useState(true);

  return (
    <SearchBarContext.Provider value={{ showSearchBar, setShowSearchBar }}>
      {children}
    </SearchBarContext.Provider>
  );
};

export const useSearchBarContext = () => {
  const ctx = useContext(SearchBarContext);
  if (!ctx) throw new Error('useSearchBarContext must be used within SearchBarProvider');
  return ctx;
};