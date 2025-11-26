import { sportsData } from "../shared/sports-leagues";

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkAllBadges() {
  console.log("Checking ALL badge URLs across all sports...\n");
  
  let totalLeagues = 0;
  let totalBroken = 0;
  let totalWorking = 0;
  let totalNoBadge = 0;
  
  const brokenBySpeed: Array<{ sport: string; league: string; id: string; badge: string }> = [];
  
  for (const sport of sportsData) {
    console.log(`\n=== ${sport.name} (${sport.leagues.length} leagues) ===`);
    
    for (const league of sport.leagues) {
      totalLeagues++;
      
      if (!league.badge) {
        totalNoBadge++;
        console.log(`  ⚪ ${league.name} - NO BADGE`);
        continue;
      }
      
      const isWorking = await checkBadgeURL(league.badge);
      
      if (isWorking) {
        totalWorking++;
        console.log(`  ✅ ${league.name}`);
      } else {
        totalBroken++;
        brokenBySpeed.push({
          sport: sport.name,
          league: league.name,
          id: league.id,
          badge: league.badge,
        });
        console.log(`  ❌ ${league.name} - BROKEN`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`\n\n=== OVERALL SUMMARY ===`);
  console.log(`Total leagues: ${totalLeagues}`);
  console.log(`Working badges: ${totalWorking}`);
  console.log(`Broken badges: ${totalBroken}`);
  console.log(`No badge: ${totalNoBadge}`);
  console.log(`Success rate: ${((totalWorking / (totalWorking + totalBroken)) * 100).toFixed(1)}%`);
  
  if (brokenBySpeed.length > 0) {
    console.log(`\n\n=== BROKEN BADGES BY SPORT ===`);
    brokenBySpeed.forEach(item => {
      console.log(`\n${item.sport} - ${item.league}`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Badge: ${item.badge}`);
    });
  } else {
    console.log("\n\n✅ ALL BADGES ARE WORKING!");
  }
}

checkAllBadges();
