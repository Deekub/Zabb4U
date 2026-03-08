const { spawn } = require('child_process');

const backend = spawn('node', ['backend/server.js'], { stdio: 'inherit' });

const expo = spawn('npx', ['expo'], { stdio: 'inherit', shell: true });

// หากปิด Expo ก็ปิด backend ตาม
expo.on('exit', () => {
  backend.kill('SIGINT');
});
