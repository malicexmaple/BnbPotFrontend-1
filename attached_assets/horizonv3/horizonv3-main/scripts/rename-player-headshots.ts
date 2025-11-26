import { atpPlayers } from '../shared/players';
import { rename } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'server', 'public');

async function renamePlayerHeadshots() {
  console.log('Renaming player headshots to use player names...\n');
  
  let renamed = 0;
  let skipped = 0;
  
  for (const [playerName, playerData] of Object.entries(atpPlayers)) {
    const oldFilename = `${playerData.code}.png`;
    const oldPath = path.join(PUBLIC_DIR, oldFilename);
    
    // Create a safe filename from player name
    const safePlayerName = playerName
      .toLowerCase()
      .replace(/'/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const newFilename = `${safePlayerName}.png`;
    const newPath = path.join(PUBLIC_DIR, newFilename);
    
    if (!existsSync(oldPath)) {
      console.log(`⚠️  Skipping ${playerName} - file not found: ${oldFilename}`);
      skipped++;
      continue;
    }
    
    if (oldPath === newPath) {
      console.log(`✓ Already renamed: ${playerName}`);
      continue;
    }
    
    try {
      await rename(oldPath, newPath);
      console.log(`✓ Renamed: ${oldFilename} -> ${newFilename} (${playerName})`);
      renamed++;
    } catch (error) {
      console.error(`❌ Error renaming ${oldFilename}:`, error);
    }
  }
  
  console.log(`\n✅ Renaming complete: ${renamed} files renamed, ${skipped} skipped`);
}

renamePlayerHeadshots().catch(console.error);
