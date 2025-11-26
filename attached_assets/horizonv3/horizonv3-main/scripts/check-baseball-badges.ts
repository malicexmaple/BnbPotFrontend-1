import { sportsData } from "../shared/sports-leagues";

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkBaseballBadges() {
  const baseballSport = sportsData.find(s => s.id === "baseball");
  
  if (!baseballSport) {
    console.log("Baseball sport not found!");
    return;
  }
  
  console.log(`Checking ${baseballSport.leagues.length} baseball league badges...\n`);
  
  const broken: typeof baseballSport.leagues = [];
  let working = 0;
  
  for (const league of baseballSport.leagues) {
    if (!league.badge) {
      console.log(`⚠️  ${league.name} - NO BADGE`);
      continue;
    }
    
    const isWorking = await checkBadgeURL(league.badge);
    
    if (isWorking) {
      working++;
      console.log(`✅ ${league.name}`);
    } else {
      broken.push(league);
      console.log(`❌ ${league.name} - BROKEN`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working}`);
  console.log(`Broken: ${broken.length}`);
  console.log(`Total: ${baseballSport.leagues.length}`);
  
  if (broken.length > 0) {
    console.log(`\n=== BROKEN BADGES ===`);
    broken.forEach(league => {
      console.log(`ID ${league.id}: ${league.name}`);
    });
  } else {
    console.log("\n✅ ALL BADGES WORKING!");
  }
}

checkBaseballBadges();
