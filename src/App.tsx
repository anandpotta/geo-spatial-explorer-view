
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GeoSpatialExplorer from './components/GeoSpatialExplorer';
import LoginPage from './components/auth/LoginPage';
import Header from './components/auth/Header';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  
  console.log('AppContent render - authenticated:', isAuthenticated);
  
  return (
    <div className="h-screen flex flex-col">
      {isAuthenticated && <Header />}
      {isAuthenticated ? <GeoSpatialExplorer /> : <LoginPage />}
    </div>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
