async function checkAthletics() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Athletics"
  );
  const data = await response.json();
  
  console.log("All Athletics leagues:");
  data.countries.forEach((league: any) => {
    console.log(`${league.idLeague}: ${league.strLeague}`);
    if (league.strLeague && league.strLeague.includes("U20")) {
      console.log(`  ✓ FOUND U20: ${league.idLeague} - ${league.strLeague}`);
      console.log(`  Badge: ${league.strBadge}`);
    }
  });
}

checkAthletics();
