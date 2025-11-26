import { sportsData } from "../shared/sports-leagues";

async function checkBadge(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function verify() {
  const americanFootball = sportsData.find(s => s.id === "american-football");
  
  if (!americanFootball) {
    console.log("American Football not found!");
    return;
  }
  
  console.log(`Checking ${americanFootball.leagues.length} American Football league badges...\n`);
  
  let working = 0;
  let broken = 0;
  
  for (const league of americanFootball.leagues) {
    const isWorking = await checkBadge(league.badge);
    
    if (isWorking) {
      working++;
      console.log(`✅ ${league.name}`);
    } else {
      broken++;
      console.log(`❌ ${league.name}`);
      console.log(`   ${league.badge}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== RESULTS ===`);
  console.log(`Working: ${working}/${americanFootball.leagues.length}`);
  console.log(`Broken: ${broken}/${americanFootball.leagues.length}`);
  
  if (broken === 0) {
    console.log("\n✅ ALL AMERICAN FOOTBALL BADGES WORKING!");
  }
}

verify();
