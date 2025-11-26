const API_KEY = process.env.THESPORTSDB_API_KEY || "3";

const brokenLeagues = [
  { id: "4347", name: "Mexican Liga MX" },
  { id: "5324", name: "UEFA Conference League" },
  { id: "4380", name: "Copa Libertadores" },
  { id: "4349", name: "Copa Sudamericana" },
  { id: "4329", name: "English Championship" },
];

async function getCorrectBadgeURL(leagueId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupleague.php?id=${leagueId}`
    );
    const data = await response.json();
    
    if (data.leagues && data.leagues[0] && data.leagues[0].strBadge) {
      return data.leagues[0].strBadge.replace(
        "https://www.thesportsdb.com/images",
        "https://r2.thesportsdb.com/images"
      );
    }
    return null;
  } catch (error) {
    console.error(`Error fetching league ${leagueId}:`, error);
    return null;
  }
}

async function fixBrokenBadges() {
  console.log("Fetching correct badge URLs...\n");
  
  for (const league of brokenLeagues) {
    const correctBadge = await getCorrectBadgeURL(league.id);
    console.log(`{ id: "${league.id}", name: "${league.name}" }`);
    console.log(`  Correct badge: "${correctBadge}"\n`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

fixBrokenBadges();
