
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data directories
const DATA_DIR = path.join(__dirname, 'data');
const MARKERS_FILE = path.join(DATA_DIR, 'markers.json');
const DRAWINGS_FILE = path.join(DATA_DIR, 'drawings.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize empty files if they don't exist
    try {
      await fs.access(MARKERS_FILE);
    } catch {
      await fs.writeFile(MARKERS_FILE, '[]');
      console.log('Created empty markers file');
    }
    
    try {
      await fs.access(DRAWINGS_FILE);
    } catch {
      await fs.writeFile(DRAWINGS_FILE, '[]');
      console.log('Created empty drawings file');
    }
    
    console.log(`Data directory initialized at ${DATA_DIR}`);
  } catch (error) {
    console.error('Error initializing data directory:', error);
    process.exit(1);
  }
}

// Helper functions for data operations
async function readMarkers() {
  try {
    const data = await fs.readFile(MARKERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading markers file:', error);
    return [];
  }
}

async function writeMarkers(markers) {
  await fs.writeFile(MARKERS_FILE, JSON.stringify(markers, null, 2));
}

async function readDrawings() {
  try {
    const data = await fs.readFile(DRAWINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading drawings file:', error);
    return [];
  }
}

async function writeDrawings(drawings) {
  await fs.writeFile(DRAWINGS_FILE, JSON.stringify(drawings, null, 2));
}

// API Routes

// Health check endpoint - respond first to ensure it's always available
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Markers
app.get('/api/markers', async (req, res) => {
  try {
    const markers = await readMarkers();
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ error: 'Failed to fetch markers' });
  }
});

app.post('/api/markers', async (req, res) => {
  try {
    const marker = req.body;
    const markers = await readMarkers();
    markers.push(marker);
    await writeMarkers(markers);
    res.status(201).json(marker);
  } catch (error) {
    console.error('Error creating marker:', error);
    res.status(500).json({ error: 'Failed to create marker' });
  }
});

app.post('/api/markers/sync', async (req, res) => {
  try {
    const clientMarkers = req.body;
    const serverMarkers = await readMarkers();
    
    // Simple merge strategy: Use client markers
    // In a real app, you'd want a more sophisticated merge strategy
    await writeMarkers(clientMarkers);
    
    res.json({ message: 'Markers synced successfully' });
  } catch (error) {
    console.error('Error syncing markers:', error);
    res.status(500).json({ error: 'Failed to sync markers' });
  }
});

app.delete('/api/markers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const markers = await readMarkers();
    const filteredMarkers = markers.filter(marker => marker.id !== id);
    await writeMarkers(filteredMarkers);
    res.json({ message: 'Marker deleted successfully' });
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ error: 'Failed to delete marker' });
  }
});

// Drawings
app.get('/api/drawings', async (req, res) => {
  try {
    const drawings = await readDrawings();
    res.json(drawings);
  } catch (error) {
    console.error('Error fetching drawings:', error);
    res.status(500).json({ error: 'Failed to fetch drawings' });
  }
});

app.post('/api/drawings', async (req, res) => {
  try {
    const drawing = req.body;
    const drawings = await readDrawings();
    drawings.push(drawing);
    await writeDrawings(drawings);
    res.status(201).json(drawing);
  } catch (error) {
    console.error('Error creating drawing:', error);
    res.status(500).json({ error: 'Failed to create drawing' });
  }
});

app.post('/api/drawings/sync', async (req, res) => {
  try {
    const clientDrawings = req.body;
    const serverDrawings = await readDrawings();
    
    // Simple merge strategy: Use client drawings
    await writeDrawings(clientDrawings);
    
    res.json({ message: 'Drawings synced successfully' });
  } catch (error) {
    console.error('Error syncing drawings:', error);
    res.status(500).json({ error: 'Failed to sync drawings' });
  }
});

app.delete('/api/drawings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const drawings = await readDrawings();
    const filteredDrawings = drawings.filter(drawing => drawing.id !== id);
    await writeDrawings(filteredDrawings);
    res.json({ message: 'Drawing deleted successfully' });
  } catch (error) {
    console.error('Error deleting drawing:', error);
    res.status(500).json({ error: 'Failed to delete drawing' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message || 'Unknown error occurred'
  });
});

// Start server
async function startServer() {
  try {
    await ensureDataDir();
    
    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

startServer().catch(console.error);
