async function fixDuplicateIds() {
  // Check NHL ID
  const nhlResponse = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Ice%20Hockey"
  );
  const nhlData = await nhlResponse.json();
  
  const nhl = nhlData.countries.find((c: any) => 
    c.strLeague === "NHL"
  );
  
  if (nhl) {
    console.log("NHL correct ID:", nhl.idLeague);
    console.log("NHL badge:", nhl.strBadge);
  }
  
  // Check Athletics World U20
  const athleticsResponse = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Athletics"
  );
  const athleticsData = await athleticsResponse.json();
  
  const worldU20 = athleticsData.countries.find((c: any) => 
    c.strLeague && c.strLeague.includes("World U20")
  );
  
  if (worldU20) {
    console.log("World U20 correct ID:", worldU20.idLeague);
    console.log("World U20 badge:", worldU20.strBadge);
  }
  
  console.log("\nAll Ice Hockey leagues:");
  nhlData.countries.slice(0, 10).forEach((league: any) => {
    console.log(`${league.idLeague}: ${league.strLeague}`);
  });
}

fixDuplicateIds();
