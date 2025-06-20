
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
    main: "cjs/lib/index.js",
    module: "esm/lib/index.js", 
    types: "types/lib/index.d.ts",
    scripts: {
      test: "echo \"No tests specified\" && exit 0"
    }
  };
  
  // Remove prepublishOnly script from dist package.json since build is already done
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

  console.log('Build completed successfully!');
  console.log('Package is ready for publishing with:');
  console.log('  npm publish ./dist');
  console.log('');
  console.log('For Angular projects, import with:');
  console.log('  import { GeospatialExplorerModule } from "geospatial-explorer-lib/angular"');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
