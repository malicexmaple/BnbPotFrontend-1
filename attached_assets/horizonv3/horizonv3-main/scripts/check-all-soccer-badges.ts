import { sportsData } from "../shared/sports-leagues";

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkAllSoccerBadges() {
  const soccerSport = sportsData.find(s => s.id === "soccer");
  
  if (!soccerSport) {
    console.log("Soccer sport not found!");
    return;
  }
  
  console.log(`Checking ${soccerSport.leagues.length} soccer league badges...\n`);
  
  const broken: typeof soccerSport.leagues = [];
  const working: typeof soccerSport.leagues = [];
  
  for (const league of soccerSport.leagues) {
    if (!league.badge) {
      console.log(`⚠️  ${league.name} - NO BADGE`);
      continue;
    }
    
    const isWorking = await checkBadgeURL(league.badge);
    
    if (isWorking) {
      working.push(league);
      console.log(`✅ ${league.name}`);
    } else {
      broken.push(league);
      console.log(`❌ ${league.name} - BROKEN: ${league.badge}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working.length}`);
  console.log(`Broken: ${broken.length}`);
  console.log(`Total: ${soccerSport.leagues.length}`);
  
  if (broken.length > 0) {
    console.log(`\n=== BROKEN BADGES ===`);
    broken.forEach(league => {
      console.log(`ID ${league.id}: ${league.name}`);
      console.log(`  ${league.badge}\n`);
    });
  }
}

checkAllSoccerBadges();
