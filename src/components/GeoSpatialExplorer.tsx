
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LibraryDemo from './LibraryDemo';

const GeoSpatialExplorer = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">GeoSpatial Explorer</h1>
      
      <Tabs defaultValue="demo" className="w-full">
        <TabsList>
          <TabsTrigger value="demo">Library Demo</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo">
          <LibraryDemo />
        </TabsContent>
        
        <TabsContent value="docs">
          <div className="prose max-w-none">
            <h2>GeoSpatial Explorer Library</h2>
            <p>
              This is a cross-platform library for geospatial visualization that works across
              React Web, React Native, and Angular applications.
            </p>
            
            <h3>Core Components</h3>
            <ul>
              <li><strong>GlobeComponent:</strong> 3D interactive globe based on Three.js</li>
              <li><strong>MapComponent:</strong> 2D interactive map</li>
            </ul>
            
            <h3>Usage Examples</h3>
            
            <h4>React Web</h4>
            <pre className="bg-gray-100 p-4 rounded">
              {`
import { ReactComponents } from 'geospatial-explorer-lib';
const { GlobeComponent } = ReactComponents;

function App() {
  return (
    <div style={{ height: '500px' }}>
      <GlobeComponent 
        selectedLocation={{ id: 'nyc', label: 'New York', x: -74.006, y: 40.7128 }}
        onReady={() => console.log('Globe ready')}
      />
    </div>
  );
}
              `}
            </pre>
            
            <h4>React Native</h4>
            <pre className="bg-gray-100 p-4 rounded">
              {`
import { ReactNativeComponents } from 'geospatial-explorer-lib';
const { GlobeComponent } = ReactNativeComponents;

function GlobeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <GlobeComponent 
        selectedLocation={{ id: 'nyc', label: 'New York', x: -74.006, y: 40.7128 }}
      />
    </View>
  );
}
              `}
            </pre>
            
            <h4>Angular</h4>
            <pre className="bg-gray-100 p-4 rounded">
              {`
// app.component.ts
@Component({
  template: \`
    <div style="height: 500px;">
      <app-globe [selectedLocation]="location"></app-globe>
    </div>
  \`
})
export class AppComponent {
  location = { id: 'nyc', label: 'New York', x: -74.006, y: 40.7128 };
}
              `}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeoSpatialExplorer;
