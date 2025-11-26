import type { League } from "../shared/sports-leagues";

const API_KEY = process.env.THESPORTSDB_API_KEY || "3";

interface ApiLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strCountry?: string;
  strBadge?: string;
}

async function fetchAllSoccerLeagues(): Promise<League[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/all_leagues.php`;
    console.log("Fetching from:", url);
    
    const response = await fetch(url);
    const data = await response.json();

    console.log("API Response keys:", Object.keys(data));
    console.log("Full response:", JSON.stringify(data).substring(0, 500));

    if (!data.leagues) {
      console.error("No leagues data returned from API");
      return [];
    }

    const soccerLeagues = data.leagues
      .filter((league: ApiLeague) => league.strSport === "Soccer")
      .map((league: ApiLeague) => {
        const displayName =
          league.strLeague.length > 20
            ? league.strLeague.substring(0, 20) + "..."
            : league.strLeague;

        const badge = league.strBadge
          ? league.strBadge.replace(
              "https://www.thesportsdb.com/images",
              "https://r2.thesportsdb.com/images"
            )
          : undefined;

        return {
          id: league.idLeague,
          name: league.strLeague,
          displayName,
          badge,
        };
      })
      .filter((league: League) => league.badge);

    console.log(`Found ${soccerLeagues.length} soccer leagues with badges`);
    return soccerLeagues;
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

async function main() {
  const leagues = await fetchAllSoccerLeagues();

  console.log("\n// Add this to sports-leagues.ts:\n");
  console.log("leagues: [");
  leagues.forEach((league) => {
    console.log(
      `  { id: "${league.id}", name: "${league.name}", displayName: "${league.displayName}", badge: "${league.badge}" },`
    );
  });
  console.log("]");
}

main();
