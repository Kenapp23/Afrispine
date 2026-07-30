const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = fs.openSync('/tmp/afrispine-server.log', 'a');
const errFile = fs.openSync('/tmp/afrispine-server.log', 'a');

const child = spawn('node', [
  path.join(__dirname, '..', '.next', 'standalone', 'server.js')
], {
  detached: true,
  stdio: ['ignore', logFile, errFile],
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=1800',
    HOSTNAME: '0.0.0.0',
    PORT: '3000'
  },
  cwd: path.join(__dirname, '..')
});

child.unref();
console.log(`Server daemon started with PID ${child.pid}`);