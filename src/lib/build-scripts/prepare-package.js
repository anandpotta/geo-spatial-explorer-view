
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy package-build.json to package.json for publishing
const packageBuildPath = path.join(__dirname, '..', 'package-build.json');
const packagePath = path.join(__dirname, '..', 'package.json');

if (fs.existsSync(packageBuildPath)) {
  const packageContent = fs.readFileSync(packageBuildPath, 'utf8');
  fs.writeFileSync(packagePath, packageContent);
  console.log('✅ package.json prepared for publishing');
} else {
  console.error('❌ package-build.json not found');
  process.exit(1);
}

// Ensure dist directory exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
  console.log('✅ dist directory created');
}

console.log('🚀 Package preparation complete');
