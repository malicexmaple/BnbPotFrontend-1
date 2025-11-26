import { sportsData } from "../shared/sports-leagues";

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkAllBasketballBadges() {
  const basketballSport = sportsData.find(s => s.id === "basketball");
  
  if (!basketballSport) {
    console.log("Basketball sport not found!");
    return;
  }
  
  console.log(`Checking all ${basketballSport.leagues.length} basketball league badges...\n`);
  
  const broken: typeof basketballSport.leagues = [];
  let working = 0;
  
  for (const league of basketballSport.leagues) {
    if (!league.badge) {
      console.log(`⚠️  ${league.name} - NO BADGE`);
      broken.push(league);
      continue;
    }
    
    const isWorking = await checkBadgeURL(league.badge);
    
    if (isWorking) {
      working++;
      console.log(`✅ ${league.name}`);
    } else {
      broken.push(league);
      console.log(`❌ ${league.name} (ID: ${league.id})`);
      console.log(`   Badge: ${league.badge}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working}`);
  console.log(`Broken: ${broken.length}`);
  console.log(`Total: ${basketballSport.leagues.length}`);
  
  if (broken.length > 0) {
    console.log(`\n=== BROKEN BADGES (${broken.length}) ===`);
    broken.forEach(league => {
      console.log(`ID ${league.id}: ${league.name}`);
      console.log(`  ${league.badge}`);
    });
  } else {
    console.log("\n✅ ALL BADGES WORKING!");
  }
}

checkAllBasketballBadges();
