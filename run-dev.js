
const concurrently = require('concurrently');
const chalk = require('chalk');

console.log(chalk.blue('Starting Geospatial Explorer application...'));
console.log(chalk.blue('✓ Frontend will be available at: http://localhost:8080'));
console.log(chalk.green('✓ Backend API will be available at: http://localhost:3001/api'));

concurrently([
  { 
    command: 'npm run dev', 
    name: 'frontend', 
    prefixColor: 'blue',
    env: { BROWSER: 'none' }
  },
  { 
    command: 'cd server && npm run dev', 
    name: 'backend', 
    prefixColor: 'green',
    env: {}
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3,
  restartDelay: 1000,
}).then(
  () => console.log('All processes exited with code 0'),
  (error) => console.error('Error occurred:', error)
);
