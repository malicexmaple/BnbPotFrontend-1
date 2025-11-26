async function checkLeagues() {
  // Check Copa Libertadores
  const soccerResponse = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Soccer"
  );
  const soccerData = await soccerResponse.json();
  
  const copaLib = soccerData.countries.find((c: any) => 
    c.strLeague && c.strLeague.includes("Libertadores")
  );
  
  if (copaLib) {
    console.log("Copa Libertadores correct ID:", copaLib.idLeague);
    console.log("Copa Libertadores name:", copaLib.strLeague);
    console.log("Copa Libertadores badge:", copaLib.strBadge);
  }
  
  // Check Bahrain Premier League
  const bahrain = soccerData.countries.find((c: any) => 
    c.strLeague && c.strLeague.includes("Bahrain")
  );
  
  if (bahrain) {
    console.log("\nBahrain Premier League correct ID:", bahrain.idLeague);
    console.log("Bahrain Premier League name:", bahrain.strLeague);
    console.log("Bahrain Premier League badge:", bahrain.strBadge);
  }
}

checkLeagues();
