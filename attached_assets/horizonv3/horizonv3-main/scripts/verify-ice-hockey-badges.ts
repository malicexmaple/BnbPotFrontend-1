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
  const iceHockey = sportsData.find(s => s.id === "ice-hockey");
  
  if (!iceHockey) {
    console.log("Ice Hockey not found!");
    return;
  }
  
  console.log(`Checking ${iceHockey.leagues.length} Ice Hockey league badges...\n`);
  
  let working = 0;
  let broken = 0;
  const brokenLeagues: typeof iceHockey.leagues = [];
  
  for (const league of iceHockey.leagues) {
    const isWorking = await checkBadge(league.badge);
    
    if (isWorking) {
      working++;
      console.log(`✅ ${league.name}`);
    } else {
      broken++;
      brokenLeagues.push(league);
      console.log(`❌ ${league.name}`);
      console.log(`   ${league.badge}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== RESULTS ===`);
  console.log(`Working: ${working}/${iceHockey.leagues.length}`);
  console.log(`Broken: ${broken}/${iceHockey.leagues.length}`);
  
  if (broken === 0) {
    console.log("\n✅ ALL ICE HOCKEY BADGES WORKING!");
  }
}

verify();
