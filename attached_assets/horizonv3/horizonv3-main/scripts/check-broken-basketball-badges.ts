import { sportsData } from "../shared/sports-leagues";

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkBrokenBadges() {
  const basketballSport = sportsData.find(s => s.id === "basketball");
  
  if (!basketballSport) {
    console.log("Basketball sport not found!");
    return;
  }
  
  const leaguesToCheck = [
    "Croatian Premijer Liga",
    "Cyprus Basketball Division A", 
    "Czech NBL"
  ];
  
  console.log("Checking specific basketball league badges...\n");
  
  for (const leagueName of leaguesToCheck) {
    const league = basketballSport.leagues.find(l => l.name.includes(leagueName.split(' ')[0]));
    
    if (!league) {
      console.log(`⚠️  ${leagueName} - NOT FOUND IN DATA`);
      continue;
    }
    
    if (!league.badge) {
      console.log(`⚠️  ${league.name} - NO BADGE`);
      continue;
    }
    
    const isWorking = await checkBadgeURL(league.badge);
    
    if (isWorking) {
      console.log(`✅ ${league.name} - WORKING`);
    } else {
      console.log(`❌ ${league.name} (ID: ${league.id}) - BROKEN`);
      console.log(`   Badge URL: ${league.badge}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

checkBrokenBadges();
