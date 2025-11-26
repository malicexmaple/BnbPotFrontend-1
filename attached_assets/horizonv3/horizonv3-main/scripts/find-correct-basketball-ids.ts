async function findCorrectIds() {
  const response = await fetch(
    "https://www.thesportsdb.com/api/v1/json/164325/search_all_leagues.php?s=Basketball"
  );
  const data = await response.json();
  
  const hungarian = data.countries.find((l: any) => 
    l.strLeague && l.strLeague.includes("Hungarian")
  );
  
  const portuguese = data.countries.find((l: any) => 
    l.strLeague && l.strLeague.includes("Portuguese")
  );
  
  const russianVTB = data.countries.find((l: any) => 
    l.strLeague && l.strLeague.includes("VTB")
  );
  
  console.log("Hungarian:", hungarian?.idLeague, "-", hungarian?.strLeague);
  console.log("Portuguese:", portuguese?.idLeague, "-", portuguese?.strLeague);
  console.log("Russian VTB:", russianVTB?.idLeague, "-", russianVTB?.strLeague);
}

findCorrectIds();
