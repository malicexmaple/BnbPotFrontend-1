const API_KEY = "164325";

const brokenLeagueIds = [
  "5159", "5160", "5161", "5643", "4936", "4935", "4923", "4930", 
  "4927", "4924", "4921", "5155", "5156", "5601", "5277", "5276",
  "5152", "4976", "5467", "5468", "5469", "5470", "5376", "5510"
];

async function checkBadge(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function refetchBrokenLeagues() {
  console.log(`Re-fetching ${brokenLeagueIds.length} broken league badges from API...\n`);
  
  for (const id of brokenLeagueIds) {
    const detailResponse = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupleague.php?id=${id}`);
    const detailData = await detailResponse.json();
    
    if (detailData.leagues && detailData.leagues[0]) {
      const league = detailData.leagues[0];
      const badgeFromAPI = league.strBadge || league.strLogo || "";
      
      if (badgeFromAPI) {
        // Test both domains
        const r2Badge = badgeFromAPI.replace("www.thesportsdb.com", "r2.thesportsdb.com");
        const wwwBadge = badgeFromAPI.replace("r2.thesportsdb.com", "www.thesportsdb.com");
        
        const r2Works = await checkBadge(r2Badge);
        const wwwWorks = await checkBadge(wwwBadge);
        
        const workingBadge = r2Works ? r2Badge : (wwwWorks ? wwwBadge : "NONE");
        const status = r2Works ? "✅ r2" : (wwwWorks ? "✅ www" : "❌ BROKEN");
        
        console.log(`${status} - ID ${id}: ${league.strLeague}`);
        if (workingBadge !== "NONE") {
          console.log(`   Badge: ${workingBadge}`);
        } else {
          console.log(`   API returned: ${badgeFromAPI}`);
          console.log(`   Both r2 and www tested: BOTH BROKEN`);
        }
      } else {
        console.log(`❌ NO BADGE - ID ${id}: ${league.strLeague}`);
      }
    } else {
      console.log(`❌ LEAGUE NOT FOUND - ID ${id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

refetchBrokenLeagues();
