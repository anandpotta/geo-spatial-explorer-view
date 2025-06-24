
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

  // Install Angular dev dependencies temporarily for build
  console.log('Installing Angular dependencies for build...');
  try {
    execSync('npm install @angular/core@^17.0.0 @angular/common@^17.0.0 --no-save --silent', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
  } catch (error) {
    console.log('Angular dependencies installation failed, but continuing build...');
  }

  // Ensure node_modules/@angular exists before building
  const angularCorePath = path.join(__dirname, 'node_modules', '@angular', 'core');
  if (!fs.existsSync(angularCorePath)) {
    console.log('Creating stub Angular modules for build...');
    fs.mkdirSync(path.join(__dirname, 'node_modules', '@angular', 'core'), { recursive: true });
    fs.mkdirSync(path.join(__dirname, 'node_modules', '@angular', 'common'), { recursive: true });
    
    // Create basic stub files
    fs.writeFileSync(path.join(__dirname, 'node_modules', '@angular', 'core', 'index.d.ts'), `
export declare class Component { }
export declare class NgModule { }
export declare class Input { }
export declare class Output { }
export declare class EventEmitter<T> { }
export declare class ElementRef { }
export declare class ViewChild { }
export declare class OnInit { }
export declare class OnDestroy { }
export declare class AfterViewInit { }
export declare class OnChanges { }
export declare class SimpleChanges { }
`);
    
    fs.writeFileSync(path.join(__dirname, 'node_modules', '@angular', 'common', 'index.d.ts'), `
export declare class CommonModule { }
`);
  }

  console.log('Building CommonJS...');
  execSync('npx tsc --project ./tsconfig.build.json --module commonjs --outDir ./dist/cjs --skipLibCheck', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building ES Modules...');
  execSync('npx tsc --project ./tsconfig.build.json --module es2015 --outDir ./dist/esm --skipLibCheck', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  console.log('Building TypeScript definitions...');
  execSync('npx tsc --project ./tsconfig.build.json --declaration --declarationMap --declarationDir ./dist/types --emitDeclarationOnly --skipLibCheck', { 
    stdio: 'inherit',
    cwd: __dirname 
  });

  // Read package.json and create distribution version
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  // Update the package.json for distribution
  const distPackageJson = {
    ...packageJson,
    main: "./cjs/index.js",
    module: "./esm/index.js", 
    types: "./types/index.d.ts",
    exports: {
      ".": {
        "import": "./esm/index.js",
        "require": "./cjs/index.js",
        "types": "./types/index.d.ts"
      },
      "./react": {
        "import": "./esm/react/index.js",
        "require": "./cjs/react/index.js",
        "types": "./types/react/index.d.ts"
      },
      "./angular": {
        "import": "./esm/angular/index.js",
        "require": "./cjs/angular/index.js",
        "types": "./types/angular/index.d.ts"
      },
      "./react-native": {
        "import": "./esm/react-native/index.js",
        "require": "./cjs/react-native/index.js",
        "types": "./types/react-native/index.d.ts"
      }
    },
    scripts: {
      test: "echo \"No tests specified\" && exit 0"
    }
  };
  
  // Remove build-related scripts and devDependencies for distribution
  delete distPackageJson.scripts.prepublishOnly;
  delete distPackageJson.scripts.build;
  delete distPackageJson.scripts['build:cjs'];
  delete distPackageJson.scripts['build:esm'];
  delete distPackageJson.scripts['build:types'];
  delete distPackageJson.devDependencies;
  
  fs.writeFileSync('./dist/package.json', JSON.stringify(distPackageJson, null, 2));

  // Copy README.md to dist
  if (fs.existsSync('./README.md')) {
    fs.copyFileSync('./README.md', './dist/README.md');
  }

  // Copy integration guide
  if (fs.existsSync('./ANGULAR_INTEGRATION_GUIDE.md')) {
    fs.copyFileSync('./ANGULAR_INTEGRATION_GUIDE.md', './dist/ANGULAR_INTEGRATION_GUIDE.md');
  }

  // Create subpath package.json files for better module resolution
  const createSubPathPackage = (subpath, relativePath) => {
    const subPathDir = path.join('./dist', subpath);
    fs.mkdirSync(subPathDir, { recursive: true });
    
    const subPackageJson = {
      "main": `../${relativePath}/cjs/${subpath}/index.js`,
      "module": `../${relativePath}/esm/${subpath}/index.js`,
      "types": `../${relativePath}/types/${subpath}/index.d.ts`
    };
    
    fs.writeFileSync(path.join(subPathDir, 'package.json'), JSON.stringify(subPackageJson, null, 2));
  };

  createSubPathPackage('angular', '.');
  createSubPathPackage('react', '.');
  createSubPathPackage('react-native', '.');

  console.log('Build completed successfully!');
  console.log('');
  console.log('To publish the package:');
  console.log('  cd dist && npm publish');
  console.log('');
  console.log('To test the package locally:');
  console.log('  cd dist && npm pack');
  console.log('  npm install ../path/to/geospatial-explorer-lib-x.x.x.tgz');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
