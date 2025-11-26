async function fixBrokenBadges() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Basketball"
  );
  const data = await response.json();
  
  // Find Croatian league
  const croatian = data.countries.find((l: any) => 
    l.idLeague === "5705"
  );
  
  // Find Czech league
  const czech = data.countries.find((l: any) => 
    l.idLeague === "5405"
  );
  
  console.log("Croatian Premijer Liga:");
  console.log(`  ID: ${croatian?.idLeague}`);
  console.log(`  Name: ${croatian?.strLeague}`);
  console.log(`  Badge: ${croatian?.strBadge}`);
  
  console.log("\nCzech NBL:");
  console.log(`  ID: ${czech?.idLeague}`);
  console.log(`  Name: ${czech?.strLeague}`);
  console.log(`  Badge: ${czech?.strBadge}`);
}

fixBrokenBadges();
