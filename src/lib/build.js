
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
  execSync('npx tsc --project ./tsconfig.json --module commonjs --outDir ./dist/cjs --declaration false --declarationMap false --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --noEmit false --allowImportingTsExtensions false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building ES Modules...');
  execSync('npx tsc --project ./tsconfig.json --module es2015 --outDir ./dist/esm --declaration false --declarationMap false --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --noEmit false --allowImportingTsExtensions false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building TypeScript definitions...');
  execSync('npx tsc --project ./tsconfig.json --declaration --declarationMap --declarationDir ./dist/types --emitDeclarationOnly --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --allowImportingTsExtensions false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  // Copy package.json to dist
  const packageJson = require('./package.json');
  fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 2));

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
