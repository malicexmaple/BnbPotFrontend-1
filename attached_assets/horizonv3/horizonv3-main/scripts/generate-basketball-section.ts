async function generateBasketballSection() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Basketball"
  );
  const data = await response.json();
  
  const leaguesWithBadges = data.countries.filter((league: any) => league.strBadge);
  
  console.log("  {");
  console.log("    id: \"basketball\",");
  console.log("    name: \"Basketball\",");
  console.log("    iconName: \"CircleDot\",");
  console.log("    leagues: [");
  
  leaguesWithBadges.forEach((league: any, index: number) => {
    const displayName = league.strLeague.length > 30 
      ? league.strLeague.substring(0, 27) + "..." 
      : league.strLeague;
    
    const comma = index < leaguesWithBadges.length - 1 ? "," : "";
    console.log(`      { id: "${league.idLeague}", name: "${league.strLeague}", displayName: "${displayName}", badge: "${league.strBadge.replace('www.thesportsdb.com', 'r2.thesportsdb.com')}" }${comma}`);
  });
  
  console.log("    ],");
  console.log("  },");
  
  console.log(`\nTotal: ${leaguesWithBadges.length} leagues`);
}

generateBasketballSection();
