
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
  execSync('npx tsc --project ./tsconfig.build.json --module commonjs --outDir ./dist/cjs --declaration false --declarationMap false --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --noEmit false --strict false --noImplicitAny false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building ES Modules...');
  execSync('npx tsc --project ./tsconfig.build.json --module es2015 --outDir ./dist/esm --declaration false --declarationMap false --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --noEmit false --strict false --noImplicitAny false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building TypeScript definitions...');
  execSync('npx tsc --project ./tsconfig.build.json --declaration --declarationMap --declarationDir ./dist/types --emitDeclarationOnly --target es2017 --skipLibCheck --rootDir ../../src --moduleResolution node --strict false --noImplicitAny false', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  // Read package.json from current directory and copy to dist
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Update the package.json for the dist version - remove prepublishOnly script
  const distPackageJson = {
    ...packageJson,
    main: "./cjs/lib/index.js",
    module: "./esm/lib/index.js", 
    types: "./types/lib/index.d.ts",
    exports: {
      ".": {
        "import": "./esm/lib/index.js",
        "require": "./cjs/lib/index.js",
        "types": "./types/lib/index.d.ts"
      },
      "./react": {
        "import": "./esm/lib/react/index.js",
        "require": "./cjs/lib/react/index.js",
        "types": "./types/lib/react/index.d.ts"
      },
      "./angular": {
        "import": "./esm/lib/angular/index.js",
        "require": "./cjs/lib/angular/index.js",
        "types": "./types/lib/angular/index.d.ts"
      },
      "./react-native": {
        "import": "./esm/lib/react-native/index.js",
        "require": "./cjs/lib/react-native/index.js",
        "types": "./types/lib/react-native/index.d.ts"
      }
    },
    scripts: {
      test: "echo \"No tests specified\" && exit 0"
    }
  };
  
  // Remove build-related scripts from dist package.json since build is already done
  delete distPackageJson.scripts.prepublishOnly;
  delete distPackageJson.scripts.build;
  delete distPackageJson.scripts['build:cjs'];
  delete distPackageJson.scripts['build:esm'];
  delete distPackageJson.scripts['build:types'];
  
  fs.writeFileSync('./dist/package.json', JSON.stringify(distPackageJson, null, 2));

  // Copy README.md to dist
  if (fs.existsSync('./README.md')) {
    fs.copyFileSync('./README.md', './dist/README.md');
    console.log('Copied README.md to dist directory');
  } else {
    console.warn('README.md not found in library directory');
  }

  // Create an index.d.ts file in the root of dist for better TypeScript support
  const indexDts = `export * from './types/lib/index';`;
  fs.writeFileSync('./dist/index.d.ts', indexDts);

  // Create individual module index files for better path resolution
  const angularIndexDts = `export * from './types/lib/angular/index';`;
  fs.mkdirSync('./dist/angular', { recursive: true });
  fs.writeFileSync('./dist/angular/index.d.ts', angularIndexDts);
  fs.writeFileSync('./dist/angular/package.json', JSON.stringify({
    "main": "../cjs/lib/angular/index.js",
    "module": "../esm/lib/angular/index.js",
    "types": "../types/lib/angular/index.d.ts"
  }, null, 2));

  const reactIndexDts = `export * from './types/lib/react/index';`;
  fs.mkdirSync('./dist/react', { recursive: true });
  fs.writeFileSync('./dist/react/index.d.ts', reactIndexDts);
  fs.writeFileSync('./dist/react/package.json', JSON.stringify({
    "main": "../cjs/lib/react/index.js",
    "module": "../esm/lib/react/index.js",
    "types": "../types/lib/react/index.d.ts"
  }, null, 2));

  const reactNativeIndexDts = `export * from './types/lib/react-native/index';`;
  fs.mkdirSync('./dist/react-native', { recursive: true });
  fs.writeFileSync('./dist/react-native/index.d.ts', reactNativeIndexDts);
  fs.writeFileSync('./dist/react-native/package.json', JSON.stringify({
    "main": "../cjs/lib/react-native/index.js",
    "module": "../esm/lib/react-native/index.js",
    "types": "../types/lib/react-native/index.d.ts"
  }, null, 2));

  console.log('Build completed successfully!');
  console.log('Package is ready for publishing with:');
  console.log('  npm publish ./dist');
  console.log('');
  console.log('For Angular projects, import with:');
  console.log('  import { GeospatialExplorerModule } from "geospatial-explorer-lib/angular"');
  console.log('For React projects, import with:');
  console.log('  import { MapComponent } from "geospatial-explorer-lib/react"');
  console.log('For React Native projects, import with:');
  console.log('  import { MapComponent } from "geospatial-explorer-lib/react-native"');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
