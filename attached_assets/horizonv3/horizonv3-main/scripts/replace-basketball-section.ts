import { readFileSync, writeFileSync } from 'fs';

// Read the current sports-leagues.ts file
const sportsLeaguesPath = 'shared/sports-leagues.ts';
const sportsLeaguesContent = readFileSync(sportsLeaguesPath, 'utf-8');

// Read the clean basketball section
const basketballSectionPath = '/tmp/basketball-section.txt';
const basketballSection = readFileSync(basketballSectionPath, 'utf-8').trim();

// Find the basketball section boundaries
const lines = sportsLeaguesContent.split('\n');
let startIndex = -1;
let endIndex = -1;
let braceCount = 0;
let inBasketballSection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Find the start of basketball section
  if (line.includes('id: "basketball"')) {
    // Go back to find the opening brace of this object
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === '{') {
        startIndex = j;
        inBasketballSection = true;
        braceCount = 1;
        break;
      }
    }
  }
  
  // Count braces to find the end
  if (inBasketballSection && i > startIndex) {
    if (line.includes('{')) {
      braceCount += (line.match(/{/g) || []).length;
    }
    if (line.includes('}')) {
      braceCount -= (line.match(/}/g) || []).length;
    }
    
    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }
}

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find basketball section boundaries');
  process.exit(1);
}

console.log(`Found basketball section from line ${startIndex + 1} to ${endIndex + 1}`);

// Replace the basketball section
const before = lines.slice(0, startIndex).join('\n');
const after = lines.slice(endIndex + 1).join('\n');

const newContent = before + '\n' + basketballSection + '\n' + after;

// Write back
writeFileSync(sportsLeaguesPath, newContent, 'utf-8');

console.log('✅ Basketball section replaced successfully!');
console.log('Run scripts/count-leagues.ts to verify.');
