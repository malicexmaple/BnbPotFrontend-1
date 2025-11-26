async function findEuroTT() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Table%20Tennis"
  );
  const data = await response.json();
  
  console.log("All Table Tennis leagues:");
  data.countries.forEach((league: any) => {
    console.log(`${league.idLeague}: ${league.strLeague}`);
    if (league.strLeague && league.strLeague.includes("European")) {
      console.log(`  ✓ FOUND EUROPEAN: ${league.idLeague} - ${league.strLeague}`);
    }
  });
}

findEuroTT();
