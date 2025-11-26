const API_KEY = "164325";

async function fetchAllAmericanFootballLeagues() {
  try {
    const response = await fetch(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/all_leagues.php`);
    const data = await response.json();
    
    const americanFootballLeagues = data.leagues
      .filter((league: any) => league.strSport === "American Football")
      .sort((a: any, b: any) => a.strLeague.localeCompare(b.strLeague));
    
    console.log(`Found ${americanFootballLeagues.length} American Football leagues\n`);
    
    for (const league of americanFootballLeagues) {
      const badge = league.strBadge || league.strLogo;
      console.log(`      { id: "${league.idLeague}", name: "${league.strLeague}", displayName: "${league.strLeague}", badge: "${badge}" },`);
    }
    
    console.log(`\nTotal: ${americanFootballLeagues.length} leagues`);
  } catch (error) {
    console.error("Error fetching leagues:", error);
  }
}

fetchAllAmericanFootballLeagues();
