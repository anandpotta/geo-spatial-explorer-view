
const concurrently = require('concurrently');

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
