// Script to download ATP player headshots and store them locally
import { atpPlayers } from '../shared/players';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const OUTPUT_DIR = './public/player-headshots';
const BASE_URL = 'https://www.atptour.com/-/media/alias/player-headshot';

async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.status}`);
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return false;
  }
}

async function downloadAllHeadshots() {
  console.log('🏃 Starting ATP player headshot download...');
  
  // Ensure output directory exists
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create output directory:', error);
    process.exit(1);
  }

  const players = Object.values(atpPlayers);
  let successCount = 0;
  let failCount = 0;

  console.log(`📥 Downloading ${players.length} player headshots...`);

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const url = `${BASE_URL}/${player.code}`;
    const filename = `${player.code}.png`;
    const filepath = join(OUTPUT_DIR, filename);

    process.stdout.write(`[${i + 1}/${players.length}] ${player.name} (${player.code})... `);

    const success = await downloadImage(url, filepath);
    
    if (success) {
      console.log('✅');
      successCount++;
    } else {
      console.log('❌');
      failCount++;
    }

    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Download Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
}

// Run the download
downloadAllHeadshots()
  .then(() => {
    console.log('✅ Download complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Download failed:', error);
    process.exit(1);
  });
