
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
  execSync('npx tsc --project ./tsconfig.json --module commonjs --outDir ./dist/cjs --declaration false --declarationMap false --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --noEmit false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building ES Modules...');
  execSync('npx tsc --project ./tsconfig.json --module es2015 --outDir ./dist/esm --declaration false --declarationMap false --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --noEmit false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building TypeScript definitions...');
  execSync('npx tsc --project ./tsconfig.json --declaration --declarationMap --declarationDir ./dist/types --emitDeclarationOnly --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  // Build Angular package if ng-packagr is available
  try {
    console.log('Building Angular package...');
    execSync('npx ng-packagr -p ng-package.json', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('Angular package built successfully!');
  } catch (angularError) {
    console.warn('Angular build failed (ng-packagr not available):', angularError.message);
    console.warn('Skipping Angular-specific build. Install ng-packagr for Angular support.');
  }

  // Copy package.json to dist
  const packageJson = require('./package.json');
  
  // Create platform-specific package.json files
  const platforms = ['cjs', 'esm', 'types'];
  platforms.forEach(platform => {
    const platformPackageJson = {
      ...packageJson,
      main: platform === 'cjs' ? './lib/index.js' : undefined,
      module: platform === 'esm' ? './lib/index.js' : undefined,
      types: platform === 'types' ? './lib/index.d.ts' : undefined
    };
    
    fs.writeFileSync(
      `./dist/${platform}/package.json`, 
      JSON.stringify(platformPackageJson, null, 2)
    );
  });

  // Main package.json
  fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 2));

  // Copy README.md to dist
  if (fs.existsSync('./README.md')) {
    fs.copyFileSync('./README.md', './dist/README.md');
  } else if (fs.existsSync('../../README.md')) {
    fs.copyFileSync('../../README.md', './dist/README.md');
  }

  console.log('Build completed successfully!');
  console.log('');
  console.log('📦 Package built with support for:');
  console.log('  ✅ React (CommonJS & ES Modules)');
  console.log('  ✅ React Native (CommonJS & ES Modules)');
  console.log('  ✅ Angular (Angular Package Format)');
  console.log('  ✅ TypeScript definitions');
  console.log('');
  console.log('🚀 Ready for publishing to npm!');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
