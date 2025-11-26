const API_KEY = process.env.THESPORTSDB_API_KEY || "3";

interface LeagueCheck {
  id: string;
  name: string;
  currentBadge: string;
  actualBadge?: string;
  status: "ok" | "broken" | "missing";
}

const leaguesToCheck = [
  { id: "4344", name: "Portuguese Primeira Liga", badge: "https://r2.thesportsdb.com/images/media/league/badge/9f0ek21686735796.png" },
  { id: "4339", name: "Turkish Super Lig", badge: "https://r2.thesportsdb.com/images/media/league/badge/4nxfcd1686741779.png" },
  { id: "4330", name: "Scottish Premiership", badge: "https://r2.thesportsdb.com/images/media/league/badge/yc2cf21738168334.png" },
];

async function checkBadgeURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function getCorrectBadgeURL(leagueId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupleague.php?id=${leagueId}`
    );
    const data = await response.json();
    
    if (data.leagues && data.leagues[0] && data.leagues[0].strBadge) {
      return data.leagues[0].strBadge.replace(
        "https://www.thesportsdb.com/images",
        "https://r2.thesportsdb.com/images"
      );
    }
    return null;
  } catch (error) {
    console.error(`Error fetching league ${leagueId}:`, error);
    return null;
  }
}

async function verifyLeagues() {
  console.log("Checking league badge URLs...\n");
  
  const results: LeagueCheck[] = [];
  
  for (const league of leaguesToCheck) {
    console.log(`Checking: ${league.name} (${league.id})`);
    
    const isBadgeWorking = await checkBadgeURL(league.badge);
    const actualBadge = await getCorrectBadgeURL(league.id);
    
    results.push({
      id: league.id,
      name: league.name,
      currentBadge: league.badge,
      actualBadge: actualBadge || undefined,
      status: isBadgeWorking ? "ok" : actualBadge ? "broken" : "missing",
    });
    
    console.log(`  Current: ${league.badge}`);
    console.log(`  Actual:  ${actualBadge}`);
    console.log(`  Status:  ${isBadgeWorking ? "✅ OK" : "❌ BROKEN"}\n`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n=== FIXES NEEDED ===\n");
  
  const brokenLeagues = results.filter(r => r.status === "broken");
  
  if (brokenLeagues.length === 0) {
    console.log("All badges are working correctly!");
  } else {
    console.log("Replace these in sports-leagues.ts:\n");
    brokenLeagues.forEach(league => {
      console.log(`// ${league.name}`);
      console.log(`// OLD: badge: "${league.currentBadge}"`);
      console.log(`// NEW: badge: "${league.actualBadge}"`);
      console.log();
    });
  }
}

verifyLeagues();
