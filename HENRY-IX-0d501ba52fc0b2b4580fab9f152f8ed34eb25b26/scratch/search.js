const fs = require('fs');
const content = fs.readFileSync('components/CDJPortal.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('quantize') || line.toLowerCase().includes('quantise')) {
    console.log(`CDJPortal.tsx:${idx + 1}: ${line.trim()}`);
  }
});
