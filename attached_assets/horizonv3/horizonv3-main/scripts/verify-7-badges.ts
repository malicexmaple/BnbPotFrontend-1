// Quick verification of the 7 previously broken badges
const badges = [
  { id: "5706", name: "Adriatic ABA League 2", url: "https://www.thesportsdb.com/images/media/league/badge/7cdyqn1760037015.png" },
  { id: "5621", name: "FIBA Europe SuperCup Women", url: "https://www.thesportsdb.com/images/media/league/badge/q3xo2w1759344442.png" },
  { id: "4477", name: "Adriatic ABA League", url: "https://www.thesportsdb.com/images/media/league/badge/stce0n1758213648.png" },
  { id: "5117", name: "Icelandic Úrvalsdeild karla", url: "https://www.thesportsdb.com/images/media/league/badge/9u8l6e1759491006.png" },
  { id: "5118", name: "Kosovo Basketball Superleague", url: "https://www.thesportsdb.com/images/media/league/badge/o77vh81759568536.png" },
  { id: "5268", name: "Vietnam Basketball Association", url: "https://www.thesportsdb.com/images/media/league/badge/o1bhz81759931895.png" },
  { id: "4836", name: "_No League Basketball", url: "https://www.thesportsdb.com/images/media/league/badge/g3iw981761017518.png" },
];

async function verify() {
  console.log("Verifying 7 previously broken badges...\n");
  
  let working = 0;
  let broken = 0;
  
  for (const badge of badges) {
    try {
      const response = await fetch(badge.url, { method: "HEAD" });
      if (response.ok) {
        console.log(`✅ ${badge.name}`);
        working++;
      } else {
        console.log(`❌ ${badge.name} - Status: ${response.status}`);
        broken++;
      }
    } catch (error) {
      console.log(`❌ ${badge.name} - Error: ${error}`);
      broken++;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n=== RESULTS ===`);
  console.log(`Working: ${working}/7`);
  console.log(`Broken: ${broken}/7`);
  
  if (working === 7) {
    console.log("\n✅ ALL 7 BADGES NOW WORKING!");
  }
}

verify();
