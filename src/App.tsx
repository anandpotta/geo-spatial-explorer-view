
import { useState } from 'react';
import GeoSpatialExplorer from './components/GeoSpatialExplorer';

function App() {
  console.log('App component rendering');
  
  return (
    <div className="h-screen flex flex-col">
      <GeoSpatialExplorer />
    </div>
  );
}

export default App;
