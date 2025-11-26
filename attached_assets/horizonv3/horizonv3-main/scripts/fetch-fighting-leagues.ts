const API_KEY = process.env.THESPORTSDB_API_KEY || "3";

interface ApiLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strBadge?: string;
}

async function fetchAllFightingLeagues() {
  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${API_KEY}/all_leagues.php`
    );
    const data = await response.json();

    if (!data.leagues) {
      console.error("No leagues data returned from API");
      return;
    }

    const fightingLeagues = data.leagues
      .filter((league: ApiLeague) => league.strSport === "Fighting")
      .map((league: ApiLeague) => ({
        id: league.idLeague,
        name: league.strLeague,
      }));

    console.log(`Found ${fightingLeagues.length} fighting leagues\n`);

    // Now fetch details for each league to get badge URLs
    console.log("Fetching badge URLs...\n");
    
    const leaguesWithBadges: Array<{
      id: string;
      name: string;
      displayName: string;
      badge?: string;
    }> = [];

    for (const league of fightingLeagues.slice(0, 50)) {
      try {
        const detailResponse = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupleague.php?id=${league.id}`
        );
        const detailData = await detailResponse.json();

        if (detailData.leagues && detailData.leagues[0]) {
          const leagueDetail = detailData.leagues[0];
          const badge = leagueDetail.strBadge
            ? leagueDetail.strBadge.replace(
                "https://www.thesportsdb.com/images",
                "https://r2.thesportsdb.com/images"
              )
            : undefined;

          const displayName =
            league.name.length > 25
              ? league.name.substring(0, 25) + "..."
              : league.name;

          leaguesWithBadges.push({
            id: league.id,
            name: league.name,
            displayName,
            badge,
          });

          console.log(`✅ ${league.name} ${badge ? "(has badge)" : "(no badge)"}`);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error fetching details for ${league.name}:`, error);
      }
    }

    console.log(`\n\nGenerated ${leaguesWithBadges.length} fighting leagues with details\n`);
    console.log("// Add to sports-leagues.ts:\n");
    console.log("leagues: [");
    leaguesWithBadges.forEach((league) => {
      if (league.badge) {
        console.log(
          `  { id: "${league.id}", name: "${league.name}", displayName: "${league.displayName}", badge: "${league.badge}" },`
        );
      } else {
        console.log(
          `  { id: "${league.id}", name: "${league.name}", displayName: "${league.displayName}" },`
        );
      }
    });
    console.log("]");
  } catch (error) {
    console.error("Error fetching fighting leagues:", error);
  }
}

fetchAllFightingLeagues();
