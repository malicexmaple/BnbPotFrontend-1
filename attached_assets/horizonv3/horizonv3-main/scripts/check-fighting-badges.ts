import { sportsData } from "../shared/sports-leagues";

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkFightingBadges() {
  const fightingSport = sportsData.find(s => s.id === "fighting");
  
  if (!fightingSport) {
    console.log("Fighting sport not found!");
    return;
  }
  
  console.log(`Checking ${fightingSport.leagues.length} fighting league badges...\n`);
  
  let broken = 0;
  let working = 0;
  
  for (const league of fightingSport.leagues) {
    if (!league.badge) {
      console.log(`⚠️  ${league.name} - NO BADGE`);
      continue;
    }
    
    const isWorking = await checkBadgeURL(league.badge);
    
    if (isWorking) {
      working++;
      console.log(`✅ ${league.name}`);
    } else {
      broken++;
      console.log(`❌ ${league.name} - BROKEN`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working}`);
  console.log(`Broken: ${broken}`);
  console.log(`Total: ${fightingSport.leagues.length}`);
  console.log(`Success rate: ${((working / (working + broken)) * 100).toFixed(1)}%`);
}

checkFightingBadges();
