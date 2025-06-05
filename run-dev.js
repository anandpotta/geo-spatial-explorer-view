
const concurrently = require('concurrently');
const chalk = require('chalk');

console.log(chalk.blue('🚀 Starting Geospatial Explorer application...'));
console.log(chalk.yellow('⏳ Starting backend server...'));
console.log(chalk.yellow('⏳ Starting frontend development server...'));

// Add a small delay to ensure backend starts first
setTimeout(() => {
  concurrently([
    { 
      command: 'cd server && npm run dev', 
      name: 'backend', 
      prefixColor: 'green',
      env: {},
    },
    { 
      command: 'npm run dev', 
      name: 'frontend', 
      prefixColor: 'blue',
      env: { 
        BROWSER: 'none',
        npm_config_package_manager: 'npm'
      }
    }
  ], {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 3,
    restartDelay: 1000,
  }).then(
    () => console.log(chalk.green('✅ All processes exited with code 0')),
    (error) => console.error(chalk.red('❌ Error occurred:'), error)
  );
  
  console.log(chalk.green('✓ Backend API will be available at: http://localhost:3001/api'));
  console.log(chalk.blue('✓ Frontend will be available at: http://localhost:8080'));
  console.log(chalk.yellow('Note: The application will wait for the backend to be ready before making API requests.'));
}, 500);
