async function findU20() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Athletics"
  );
  const data = await response.json();
  
  // Look for the badge that matches xuwqrt1591715494.png
  const targetBadge = "https://r2.thesportsdb.com/images/media/league/badge/xuwqrt1591715494.png";
  
  const match = data.countries.find((league: any) => 
    league.strBadge === targetBadge || league.strBadge === targetBadge.replace('r2.thesportsdb.com', 'www.thesportsdb.com')
  );
  
  if (match) {
    console.log("Found matching league by badge:");
    console.log(`ID: ${match.idLeague}`);
    console.log(`Name: ${match.strLeague}`);
    console.log(`Badge: ${match.strBadge}`);
  } else {
    console.log("No match found by badge. Listing all Athletics leagues:");
    data.countries.forEach((league: any, index: number) => {
      console.log(`${index + 1}. ID ${league.idLeague}: ${league.strLeague}`);
      console.log(`   Badge: ${league.strBadge}`);
    });
  }
}

findU20();
