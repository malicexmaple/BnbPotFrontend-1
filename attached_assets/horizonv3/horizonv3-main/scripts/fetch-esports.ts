const API_KEY = "164325";

async function checkBadge(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchESportsLeagues() {
  try {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/all_leagues.php`);
    const data = await response.json();
    
    const esportsLeagues = data.leagues
      .filter((league: any) => league.strSport === "ESports")
      .sort((a: any, b: any) => a.strLeague.localeCompare(b.strLeague));
    
    console.log(`Found ${esportsLeagues.length} ESports leagues\n`);
    
    const results = [];
    
    for (const league of esportsLeagues) {
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
            badgeStatus = "✅";
          } else if (wwwWorks) {
            badge = wwwBadge;
            badgeStatus = "✅ www";
          } else {
            badgeStatus = "❌";
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
      await new Promise(resolve => setTimeout(resolve, 150));
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
    
    const working = results.filter(r => r.status.includes("✅")).length;
    const broken = results.filter(r => r.status === "❌").length;
    const noBadge = results.filter(r => !r.badge).length;
    
    console.log(`\n=== ESports Summary ===`);
    console.log(`Total: ${results.length}`);
    console.log(`Working: ${working}`);
    console.log(`Broken: ${broken}`);
    console.log(`No Badge: ${noBadge}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

fetchESportsLeagues();
