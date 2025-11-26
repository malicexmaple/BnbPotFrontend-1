const API_KEY = "164325";

async function checkBadge(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchAllIceHockeyLeagues() {
  try {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/all_leagues.php`);
    const data = await response.json();
    
    const iceHockeyLeagues = data.leagues
      .filter((league: any) => league.strSport === "Ice Hockey")
      .sort((a: any, b: any) => a.strLeague.localeCompare(b.strLeague));
    
    console.log(`Found ${iceHockeyLeagues.length} Ice Hockey leagues\n`);
    console.log("Checking badges...\n");
    
    const results = [];
    
    for (const league of iceHockeyLeagues) {
      const detailResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupleague.php?id=${league.idLeague}`);
      const detailData = await detailResponse.json();
      
      let badge = "";
      let badgeStatus = "NO BADGE";
      
      if (detailData.leagues && detailData.leagues[0]) {
        const leagueDetail = detailData.leagues[0];
        badge = leagueDetail.strBadge || leagueDetail.strLogo || "";
        
        if (badge) {
          const r2Badge = badge.replace("www.thesportsdb.com", "r2.thesportsdb.com");
          const wwwBadge = badge.replace("r2.thesportsdb.com", "www.thesportsdb.com");
          
          const r2Works = await checkBadge(r2Badge);
          const wwwWorks = await checkBadge(wwwBadge);
          
          if (r2Works) {
            badge = r2Badge;
            badgeStatus = "✅ r2";
          } else if (wwwWorks) {
            badge = wwwBadge;
            badgeStatus = "✅ www";
          } else {
            badgeStatus = "❌ BROKEN";
          }
        }
      }
      
      results.push({
        id: league.idLeague,
        name: league.strLeague,
        badge,
        status: badgeStatus
      });
      
      console.log(`${badgeStatus} - ${league.strLeague} (ID: ${league.idLeague})`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log("\n=== TypeScript Output ===\n");
    for (const league of results) {
      if (league.badge) {
        const displayName = league.name.length > 28 ? league.name.substring(0, 25) + "..." : league.name;
        console.log(`      { id: "${league.id}", name: "${league.name}", displayName: "${displayName}", badge: "${league.badge}" },`);
      } else {
        console.log(`      // NO BADGE: { id: "${league.id}", name: "${league.name}" }`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total leagues: ${results.length}`);
    console.log(`With badges: ${results.filter(r => r.badge).length}`);
    console.log(`Without badges: ${results.filter(r => !r.badge).length}`);
    console.log(`Broken badges: ${results.filter(r => r.status === "❌ BROKEN").length}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

fetchAllIceHockeyLeagues();
