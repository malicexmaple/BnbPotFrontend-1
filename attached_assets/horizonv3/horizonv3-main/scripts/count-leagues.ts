import { sportsData } from "../shared/sports-leagues";

console.log("League counts by sport:\n");

sportsData.forEach(sport => {
  console.log(`${sport.name}: ${sport.leagues.length} leagues`);
});

console.log("\n=== DETAILED COUNTS ===");
const soccer = sportsData.find(s => s.id === "soccer");
const fighting = sportsData.find(s => s.id === "fighting");
const baseball = sportsData.find(s => s.id === "baseball");
const basketball = sportsData.find(s => s.id === "basketball");

console.log(`Soccer: ${soccer?.leagues.length || 0}`);
console.log(`Fighting: ${fighting?.leagues.length || 0}`);
console.log(`Baseball: ${baseball?.leagues.length || 0}`);
console.log(`Basketball: ${basketball?.leagues.length || 0}`);

console.log("\n=== CHECKING FOR DUPLICATE IDs ===");
const allIds = sportsData.flatMap(s => s.leagues.map(l => l.id));
const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);

if (duplicates.length > 0) {
  console.log("⚠️  DUPLICATES FOUND:", [...new Set(duplicates)]);
} else {
  console.log("✅ No duplicate IDs found!");
}
