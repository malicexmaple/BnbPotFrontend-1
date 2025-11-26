import { sportsData } from "../shared/sports-leagues";

async function checkBadge(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function findBrokenAndGenerateFixes() {
  const iceHockey = sportsData.find(s => s.id === "ice-hockey");
  
  if (!iceHockey) {
    console.log("Ice Hockey not found!");
    return;
  }
  
  console.log(`Checking ${iceHockey.leagues.length} Ice Hockey league badges for broken ones...\n`);
  
  const fixes: Array<{league: typeof iceHockey.leagues[0], wwwWorks: boolean}> = [];
  
  for (const league of iceHockey.leagues) {
    const isWorking = await checkBadge(league.badge);
    
    if (!isWorking) {
      // Try www domain
      const wwwBadge = league.badge.replace("r2.thesportsdb.com", "www.thesportsdb.com");
      const wwwWorks = await checkBadge(wwwBadge);
      
      fixes.push({ league, wwwWorks });
      console.log(`❌ ${league.name} (ID: ${league.id})`);
      console.log(`   Current: ${league.badge}`);
      console.log(`   WWW works: ${wwwWorks ? "✅" : "❌"}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== ${fixes.length} BROKEN BADGES ===\n`);
  
  const fixable = fixes.filter(f => f.wwwWorks);
  console.log(`Fixable by switching to www: ${fixable.length}`);
  console.log(`Truly broken (no www): ${fixes.filter(f => !f.wwwWorks).length}`);
  
  if (fixable.length > 0) {
    console.log("\n=== IDs TO FIX ===");
    fixable.forEach(f => {
      console.log(`ID: ${f.league.id} - ${f.league.name}`);
    });
  }
}

findBrokenAndGenerateFixes();
