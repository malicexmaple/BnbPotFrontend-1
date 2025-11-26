async function fetchBasketballLeagues() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Basketball"
  );
  const data = await response.json();
  
  console.log(`Found ${data.countries.length} basketball leagues\n`);
  
  const leaguesWithBadges = data.countries.filter((league: any) => league.strBadge);
  console.log(`${leaguesWithBadges.length} have badges\n`);
  
  console.log("All basketball leagues with badges:");
  leaguesWithBadges.forEach((league: any, index: number) => {
    const displayName = league.strLeague.length > 30 
      ? league.strLeague.substring(0, 27) + "..." 
      : league.strLeague;
    
    console.log(`  { id: "${league.idLeague}", name: "${league.strLeague}", displayName: "${displayName}", badge: "${league.strBadge.replace('www.thesportsdb.com', 'r2.thesportsdb.com')}" },`);
  });
  
  console.log(`\n\nTotal leagues with badges: ${leaguesWithBadges.length}`);
}

fetchBasketballLeagues();
