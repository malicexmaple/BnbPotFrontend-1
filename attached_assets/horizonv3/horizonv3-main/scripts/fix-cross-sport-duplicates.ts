async function fixDuplicates() {
  // Check Golf - Korn Ferry Tour
  const golfResponse = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Golf"
  );
  const golfData = await golfResponse.json();
  
  const kornFerry = golfData.countries.find((l: any) => 
    l.strLeague && l.strLeague.includes("Korn Ferry")
  );
  
  // Check Netball - Super Netball
  const netballResponse = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Netball"
  );
  const netballData = await netballResponse.json();
  
  const superNetball = netballData.countries.find((l: any) => 
    l.strLeague && l.strLeague.includes("Super Netball")
  );
  
  console.log("Korn Ferry Tour correct ID:", kornFerry?.idLeague, "-", kornFerry?.strLeague);
  console.log("Super Netball correct ID:", superNetball?.idLeague, "-", superNetball?.strLeague);
}

fixDuplicates();
