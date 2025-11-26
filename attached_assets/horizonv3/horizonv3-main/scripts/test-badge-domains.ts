async function testBadgeDomains() {
  const badges = [
    { name: "Croatian (r2)", url: "https://r2.thesportsdb.com/images/media/league/badge/3mo0i41759932471.png" },
    { name: "Croatian (www)", url: "https://www.thesportsdb.com/images/media/league/badge/3mo0i41759932471.png" },
    { name: "Czech (r2)", url: "https://r2.thesportsdb.com/images/media/league/badge/2qxhi61759326394.png" },
    { name: "Czech (www)", url: "https://www.thesportsdb.com/images/media/league/badge/2qxhi61759326394.png" },
  ];
  
  for (const badge of badges) {
    try {
      const response = await fetch(badge.url, { method: "HEAD" });
      console.log(`${response.ok ? '✅' : '❌'} ${badge.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${badge.name}: ERROR`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

testBadgeDomains();
