
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building geospatial-explorer-lib...');

try {
  // Clean dist directory
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
  }

  // Create dist directories
  fs.mkdirSync('./dist', { recursive: true });
  fs.mkdirSync('./dist/cjs', { recursive: true });
  fs.mkdirSync('./dist/esm', { recursive: true });
  fs.mkdirSync('./dist/types', { recursive: true });

  console.log('Building CommonJS...');
  execSync('npx tsc -p tsconfig.json --module commonjs --outDir dist/cjs --declaration false --target es2015', { stdio: 'inherit' });

  console.log('Building ES Modules...');
  execSync('npx tsc -p tsconfig.json --module es2015 --outDir dist/esm --declaration false --target es2015', { stdio: 'inherit' });

  console.log('Building TypeScript definitions...');
  execSync('npx tsc -p tsconfig.json --declaration --declarationDir dist/types --emitDeclarationOnly --target es2015', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
