const fs = require('fs');
const glob = require('glob');

// Simple script to find where cache functions are defined in the workspace
const files = ['components/AudioProvider.tsx', 'lib/audioUtils.ts', 'lib/AudioEngine.ts'];
files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('getCachedWaveform') || line.includes('cacheWaveform')) {
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
