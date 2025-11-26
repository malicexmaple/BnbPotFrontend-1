// ATP Tour player database
// Player headshots are available at: https://www.atptour.com/-/media/alias/player-headshot/{code}

export interface TennisPlayer {
  name: string;
  code: string;
  country?: string;
}

export const atpPlayers: Record<string, TennisPlayer> = {
  // Top 10
  "Carlos Alcaraz": { name: "Carlos Alcaraz", code: "a0e2", country: "ESP" },
  "Jannik Sinner": { name: "Jannik Sinner", code: "s0ag", country: "ITA" },
  "Alexander Zverev": { name: "Alexander Zverev", code: "z355", country: "GER" },
  "Taylor Fritz": { name: "Taylor Fritz", code: "fb98", country: "USA" },
  "Novak Djokovic": { name: "Novak Djokovic", code: "d643", country: "SRB" },
  "Alex de Minaur": { name: "Alex de Minaur", code: "dh58", country: "AUS" },
  "Ben Shelton": { name: "Ben Shelton", code: "s0s1", country: "USA" },
  "Lorenzo Musetti": { name: "Lorenzo Musetti", code: "mc16", country: "ITA" },
  "Casper Ruud": { name: "Casper Ruud", code: "rh16", country: "NOR" },
  "Daniil Medvedev": { name: "Daniil Medvedev", code: "mm58", country: "RUS" },

  // Top 11-20
  "Andrey Rublev": { name: "Andrey Rublev", code: "re44", country: "RUS" },
  "Tommy Paul": { name: "Tommy Paul", code: "pw77", country: "USA" },
  "Stefanos Tsitsipas": { name: "Stefanos Tsitsipas", code: "te51", country: "GRE" },
  "Holger Rune": { name: "Holger Rune", code: "r0dw", country: "DEN" },
  "Grigor Dimitrov": { name: "Grigor Dimitrov", code: "d875", country: "BUL" },
  "Hubert Hurkacz": { name: "Hubert Hurkacz", code: "ha31", country: "POL" },
  "Frances Tiafoe": { name: "Frances Tiafoe", code: "tf35", country: "USA" },
  "Felix Auger-Aliassime": { name: "Felix Auger-Aliassime", code: "ag37", country: "CAN" },
  "Sebastian Baez": { name: "Sebastian Baez", code: "b0di", country: "ARG" },
  "Jack Draper": { name: "Jack Draper", code: "dd53", country: "GBR" },

  // Top 21-40
  "Karen Khachanov": { name: "Karen Khachanov", code: "ke29", country: "RUS" },
  "Ugo Humbert": { name: "Ugo Humbert", code: "ha49", country: "FRA" },
  "Arthur Fils": { name: "Arthur Fils", code: "f0fq", country: "FRA" },
  "Alejandro Tabilo": { name: "Alejandro Tabilo", code: "te30", country: "CHI" },
  "Sebastian Korda": { name: "Sebastian Korda", code: "kq85", country: "USA" },
  "Tomas Machac": { name: "Tomas Machac", code: "mo57", country: "CZE" },
  "Jordan Thompson": { name: "Jordan Thompson", code: "tc61", country: "AUS" },
  "Alexander Bublik": { name: "Alexander Bublik", code: "bk92", country: "KAZ" },
  "Brandon Nakashima": { name: "Brandon Nakashima", code: "n0b6", country: "USA" },
  "Francisco Cerundolo": { name: "Francisco Cerundolo", code: "c0dg", country: "ARG" },
  "Alexei Popyrin": { name: "Alexei Popyrin", code: "pb16", country: "AUS" },
  "Giovanni Mpetshi Perricard": { name: "Giovanni Mpetshi Perricard", code: "mp29", country: "FRA" },
  "Matteo Berrettini": { name: "Matteo Berrettini", code: "bk99", country: "ITA" },
  "Flavio Cobolli": { name: "Flavio Cobolli", code: "c0ea", country: "ITA" },
  "Cameron Norrie": { name: "Cameron Norrie", code: "ne58", country: "GBR" },
  "Nicolas Jarry": { name: "Nicolas Jarry", code: "j0c2", country: "CHI" },
  "Jiri Lehecka": { name: "Jiri lehecka", code: "le77", country: "CZE" },
  "Tallon Griekspoor": { name: "Tallon Griekspoor", code: "g0ao", country: "NED" },
  "Pavel Kotov": { name: "Pavel Kotov", code: "k0e6", country: "RUS" },
  "Gael Monfils": { name: "Gael Monfils", code: "mc65", country: "FRA" },

  // Top 41-60
  "Mariano Navone": { name: "Mariano Navone", code: "n0a7", country: "ARG" },
  "Lorenzo Sonego": { name: "Lorenzo Sonego", code: "sq65", country: "ITA" },
  "Nuno Borges": { name: "Nuno Borges", code: "bc31", country: "POR" },
  "Tomas Martin Etcheverry": { name: "Tomas Martin Etcheverry", code: "ea81", country: "ARG" },
  "Luciano Darderi": { name: "Luciano Darderi", code: "d0d4", country: "ITA" },
  "Joao Fonseca": { name: "Joao Fonseca", code: "f0fv", country: "BRA" },
  "Alex Michelsen": { name: "Alex Michelsen", code: "mr98", country: "USA" },
  "Marcos Giron": { name: "Marcos Giron", code: "g0ch", country: "USA" },
  "Zhizhen Zhang": { name: "Zhizhen Zhang", code: "za66", country: "CHN" },
  "Aleksandar Vukic": { name: "Aleksandar Vukic", code: "v0c6", country: "AUS" },
  "Matteo Arnaldi": { name: "Matteo Arnaldi", code: "a0et", country: "ITA" },
  "Fabian Marozsan": { name: "Fabian Marozsan", code: "mw29", country: "HUN" },
  "Jakub Mensik": { name: "Jakub Mensik", code: "m0fg", country: "CZE" },
  "Roberto Bautista Agut": { name: "Roberto Bautista Agut", code: "b0br", country: "ESP" },
  "Arthur Rinderknech": { name: "Arthur Rinderknech", code: "r0cw", country: "FRA" },
  "Aleksandar Kovacevic": { name: "Aleksandar Kovacevic", code: "k0e9", country: "USA" },
  "Christopher O'Connell": { name: "Christopher O'Connell", code: "oa83", country: "AUS" },
  "Quentin Halys": { name: "Quentin Halys", code: "hc36", country: "FRA" },
  "Miomir Kecmanovic": { name: "Miomir Kecmanovic", code: "kf42", country: "SRB" },
  "Roman Safiullin": { name: "Roman Safiullin", code: "s0bs", country: "RUS" },

  // Top 61-80
  "David Goffin": { name: "David Goffin", code: "gc07", country: "BEL" },
  "Yoshihito Nishioka": { name: "Yoshihito Nishioka", code: "ng17", country: "JPN" },
  "Adrian Mannarino": { name: "Adrian Mannarino", code: "mc77", country: "FRA" },
  "Facundo Diaz Acosta": { name: "Facundo Diaz Acosta", code: "da39", country: "ARG" },
  "Hugo Gaston": { name: "Hugo Gaston", code: "g0dl", country: "FRA" },
  "Jan-Lennard Struff": { name: "Jan-Lennard Struff", code: "sl28", country: "GER" },
  "Corentin Moutet": { name: "Corentin Moutet", code: "mo61", country: "FRA" },
  "Jaume Munar": { name: "Jaume Munar", code: "m0cm", country: "ESP" },
  "Botic van de Zandschulp": { name: "Botic van de Zandschulp", code: "vd93", country: "NED" },
  "Rinky Hijikata": { name: "Rinky Hijikata", code: "h0fj", country: "AUS" },
  "Daniel Altmaier": { name: "Daniel Altmaier", code: "ae96", country: "GER" },
  "Sumit Nagal": { name: "Sumit Nagal", code: "n0c1", country: "IND" },
  "Zizou Bergs": { name: "Zizou Bergs", code: "b0cv", country: "BEL" },
  "Pedro Martinez": { name: "Pedro Martinez", code: "mu55", country: "ESP" },
  "Juncheng Shang": { name: "Juncheng Shang", code: "s0f7", country: "CHN" },
  "Alexandre Muller": { name: "Alexandre Muller", code: "mm17", country: "FRA" },
  "Max Purcell": { name: "Max Purcell", code: "pl57", country: "AUS" },
  "Thiago Monteiro": { name: "Thiago Monteiro", code: "mu97", country: "BRA" },
  "Gabriel Diallo": { name: "Gabriel Diallo", code: "d0cf", country: "CAN" },
  "Thanasi Kokkinakis": { name: "Thanasi Kokkinakis", code: "kd46", country: "AUS" },

  // Top 81-100
  "Alexander Shevchenko": { name: "Alexander Shevchenko", code: "sa61", country: "KAZ" },
  "Federico Coria": { name: "Federico Coria", code: "c057", country: "ARG" },
  "Camilo Ugo Carabelli": { name: "Camilo Ugo Carabelli", code: "cd24", country: "ARG" },
  "Richard Gasquet": { name: "Richard Gasquet", code: "g628", country: "FRA" },
  "Mackenzie McDonald": { name: "Mackenzie McDonald", code: "md61", country: "USA" },
  "Daniel Evans": { name: "Daniel Evans", code: "e687", country: "GBR" },
  "Dominik Koepfer": { name: "Dominik Koepfer", code: "kh91", country: "GER" },
  "Pablo Carreno Busta": { name: "Pablo Carreno Busta", code: "cd51", country: "ESP" },
  "Yannick Hanfmann": { name: "Yannick Hanfmann", code: "hb61", country: "GER" },
  "Denis Shapovalov": { name: "Denis Shapovalov", code: "su55", country: "CAN" },
  "James Duckworth": { name: "James Duckworth", code: "d829", country: "AUS" },
  "Borna Coric": { name: "Borna Coric", code: "ct33", country: "CRO" },
  "Thiago Seyboth Wild": { name: "Thiago Seyboth Wild", code: "sw02", country: "BRA" },
  "Constant Lestienne": { name: "Constant Lestienne", code: "l0a7", country: "FRA" },
  "Terence Atmane": { name: "Terence Atmane", code: "as80", country: "FRA" },
  "Albert Ramos-Vinolas": { name: "Albert Ramos-Vinolas", code: "r772", country: "ESP" },
  "Roberto Carballes Baena": { name: "Roberto Carballes Baena", code: "cn75", country: "ESP" },
  "Andy Murray": { name: "Andy Murray", code: "mc10", country: "GBR" },
  "Stan Wawrinka": { name: "Stan Wawrinka", code: "w367", country: "SUI" },
  "Rafael Nadal": { name: "Rafael Nadal", code: "n409", country: "ESP" },

  // Additional popular players
  "Roger Federer": { name: "Roger Federer", code: "f324", country: "SUI" },
  "Dominic Thiem": { name: "Dominic Thiem", code: "tb69", country: "AUT" },
  "Kei Nishikori": { name: "Kei Nishikori", code: "na42", country: "JPN" },
  "Nick Kyrgios": { name: "Nick Kyrgios", code: "ke17", country: "AUS" },

  // Additional ATP players with headshots
  "Nikoloz Basilashvili": { name: "Nikoloz Basilashvili", code: "ba47", country: "GEO" },
  "Laslo Djere": { name: "Laslo Djere", code: "d0co", country: "SRB" },
  "Juan Manuel Cerundolo": { name: "Juan Manuel Cerundolo", code: "c0bg", country: "ARG" },
  "Vit Kopriva": { name: "Vit Kopriva", code: "k0ef", country: "CZE" },
  "Filip Misolic": { name: "Filip Misolic", code: "m0fa", country: "AUT" },
  "Shintaro Mochizuki": { name: "Shintaro Mochizuki", code: "m0cz", country: "JPN" },
  "Luca Nardi": { name: "Luca Nardi", code: "n0dx", country: "ITA" },
  "Emilio Nava": { name: "Emilio Nava", code: "n0b0", country: "USA" },
  "Tristan Schoolkate": { name: "Tristan Schoolkate", code: "s0es", country: "AUS" },
  "Gui Spizzirri": { name: "Gui Spizzirri", code: "s0fw", country: "BRA" },
  "Dalibor Svrcina": { name: "Dalibor Svrcina", code: "sa49", country: "CZE" },
  "Adam Walton": { name: "Adam Walton", code: "w0a6", country: "AUS" },
};

// Helper function to get player headshot URL (local storage)
export function getAtpPlayerHeadshot(playerName: string): string | null {
  const player = atpPlayers[playerName];
  if (!player) {
    return null;
  }
  
  // Create a safe filename from player name (matching the rename script logic)
  const safePlayerName = playerName
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // Return local path to downloaded headshot (now using player name instead of code)
  return `/${safePlayerName}.png`;
}

// WTA Tour player database
export const wtaPlayers: Record<string, TennisPlayer> = {
  // Top 10
  "Aryna Sabalenka": { name: "Aryna Sabalenka", code: "s0b8", country: "BLR" },
  "Iga Swiatek": { name: "Iga Swiatek", code: "s0e4", country: "POL" },
  "Coco Gauff": { name: "Coco Gauff", code: "g0d4", country: "USA" },
  "Jasmine Paolini": { name: "Jasmine Paolini", code: "p0c1", country: "ITA" },
  "Elena Rybakina": { name: "Elena Rybakina", code: "r0dh", country: "KAZ" },
  "Jessica Pegula": { name: "Jessica Pegula", code: "p0eg", country: "USA" },
  "Qinwen Zheng": { name: "Qinwen Zheng", code: "z0d9", country: "CHN" },
  "Emma Navarro": { name: "Emma Navarro", code: "n0a5", country: "USA" },
  "Daria Kasatkina": { name: "Daria Kasatkina", code: "k0c3", country: "RUS" },
  "Barbora Krejcikova": { name: "Barbora Krejcikova", code: "k0e2", country: "CZE" },

  // Top 11-20
  "Danielle Collins": { name: "Danielle Collins", code: "ca53", country: "USA" },
  "Paula Badosa": { name: "Paula Badosa", code: "b0ee", country: "ESP" },
  "Diana Shnaider": { name: "Diana Shnaider", code: "s0fh", country: "RUS" },
  "Madison Keys": { name: "Madison Keys", code: "k0d3", country: "USA" },
  "Mirra Andreeva": { name: "Mirra Andreeva", code: "a0fj", country: "RUS" },
  "Marta Kostyuk": { name: "Marta Kostyuk", code: "k0dy", country: "UKR" },
  "Donna Vekic": { name: "Donna Vekic", code: "v0c8", country: "CRO" },
  "Beatriz Haddad Maia": { name: "Beatriz Haddad Maia", code: "hm13", country: "BRA" },
  "Victoria Azarenka": { name: "Victoria Azarenka", code: "az27", country: "BLR" },
  "Katie Boulter": { name: "Katie Boulter", code: "bt38", country: "GBR" },

  // Top 21-40
  "Ons Jabeur": { name: "Ons Jabeur", code: "jb47", country: "TUN" },
  "Liudmila Samsonova": { name: "Liudmila Samsonova", code: "s0c9", country: "RUS" },
  "Jelena Ostapenko": { name: "Jelena Ostapenko", code: "oa56", country: "LAT" },
  "Ekaterina Alexandrova": { name: "Ekaterina Alexandrova", code: "aa82", country: "RUS" },
  "Anna Kalinskaya": { name: "Anna Kalinskaya", code: "k0cg", country: "RUS" },
  "Elina Svitolina": { name: "Elina Svitolina", code: "sb44", country: "UKR" },
  "Caroline Garcia": { name: "Caroline Garcia", code: "ga75", country: "FRA" },
  "Linda Noskova": { name: "Linda Noskova", code: "n0fb", country: "CZE" },
  "Anastasia Pavlyuchenkova": { name: "Anastasia Pavlyuchenkova", code: "pa65", country: "RUS" },
  "Yulia Putintseva": { name: "Yulia Putintseva", code: "pt44", country: "KAZ" },
  "Leylah Fernandez": { name: "Leylah Fernandez", code: "fe90", country: "CAN" },
  "Caroline Wozniacki": { name: "Caroline Wozniacki", code: "w345", country: "DEN" },
  "Elise Mertens": { name: "Elise Mertens", code: "ms51", country: "BEL" },
  "Dayana Yastremska": { name: "Dayana Yastremska", code: "ya65", country: "UKR" },
  "Clara Tauson": { name: "Clara Tauson", code: "t0br", country: "DEN" },
  "Magdalena Frech": { name: "Magdalena Frech", code: "fh48", country: "POL" },
  "Lulu Sun": { name: "Lulu Sun", code: "s0h7", country: "NZL" },
  "Maria Sakkari": { name: "Maria Sakkari", code: "sk85", country: "GRE" },
  "Veronika Kudermetova": { name: "Veronika Kudermetova", code: "kv61", country: "RUS" },
  "Karolina Muchova": { name: "Karolina Muchova", code: "mu58", country: "CZE" },

  // Top 41-60
  "Naomi Osaka": { name: "Naomi Osaka", code: "ob56", country: "JPN" },
  "Amanda Anisimova": { name: "Amanda Anisimova", code: "aa94", country: "USA" },
  "Sloane Stephens": { name: "Sloane Stephens", code: "ss59", country: "USA" },
  "Daria Saville": { name: "Daria Saville", code: "g0e5", country: "AUS" },
  "Bianca Andreescu": { name: "Bianca Andreescu", code: "ae94", country: "CAN" },
  "Peyton Stearns": { name: "Peyton Stearns", code: "s0g1", country: "USA" },
  "Emma Raducanu": { name: "Emma Raducanu", code: "r0dw", country: "GBR" },
  "Alize Cornet": { name: "Alize Cornet", code: "c344", country: "FRA" },
  "Bernarda Pera": { name: "Bernarda Pera", code: "pa70", country: "USA" },
  "Sofia Kenin": { name: "Sofia Kenin", code: "kn58", country: "USA" },

  // Additional Top 100 Players
  "Belinda Bencic": { name: "Belinda Bencic", code: "b0d1", country: "SUI" },
  "Victoria Mboko": { name: "Victoria Mboko", code: "m0b2", country: "CAN" },
  "McCartney Kessler": { name: "McCartney Kessler", code: "k0s1", country: "USA" },
  "Maya Joint": { name: "Maya Joint", code: "j0n1", country: "AUS" },
  "Ann Li": { name: "Ann Li", code: "l0a1", country: "USA" },
  "Marketa Vondrousova": { name: "Marketa Vondrousova", code: "v0n1", country: "CZE" },
  "Iva Jovic": { name: "Iva Jovic", code: "j0v1", country: "USA" },
  "Lois Boisson": { name: "Lois Boisson", code: "b0s1", country: "FRA" },
  "Jaqueline Cristian": { name: "Jaqueline Cristian", code: "c0r1", country: "ROU" },
  "Laura Siegemund": { name: "Laura Siegemund", code: "s0g2", country: "GER" },
  "Marie Bouzkova": { name: "Marie Bouzkova", code: "b0z1", country: "CZE" },
  "Jessica Bouzas Maneiro": { name: "Jessica Bouzas Maneiro", code: "b0m1", country: "ESP" },
  "Tatjana Maria": { name: "Tatjana Maria", code: "m0r1", country: "GER" },
  "Eva Lys": { name: "Eva Lys", code: "l0y1", country: "GER" },
  "Sorana Cirstea": { name: "Sorana Cirstea", code: "c0s1", country: "ROU" },
  "Emiliana Arango": { name: "Emiliana Arango", code: "a0r1", country: "COL" },
  "Ashlyn Krueger": { name: "Ashlyn Krueger", code: "k0r1", country: "USA" },
  "Katerina Siniakova": { name: "Katerina Siniakova", code: "s0n1", country: "CZE" },
  "Anastasia Potapova": { name: "Anastasia Potapova", code: "p0t1", country: "RUS" },
  "Alexandra Eala": { name: "Alexandra Eala", code: "e0a1", country: "PHI" },
  "Viktorija Golubic": { name: "Viktorija Golubic", code: "g0l1", country: "SUI" },
  "Magda Linette": { name: "Magda Linette", code: "l0n1", country: "POL" },
  "Tereza Valentova": { name: "Tereza Valentova", code: "v0l1", country: "CZE" },
  "Elsa Jacquemot": { name: "Elsa Jacquemot", code: "j0c1", country: "FRA" },
  "Xinyu Wang": { name: "Xinyu Wang", code: "w0x1", country: "CHN" },
  "Hailey Baptiste": { name: "Hailey Baptiste", code: "b0p1", country: "USA" },
  "Rebecca Sramkova": { name: "Rebecca Sramkova", code: "s0r1", country: "SVK" },
  "Alycia Parks": { name: "Alycia Parks", code: "p0k1", country: "USA" },
  "Sonay Kartal": { name: "Sonay Kartal", code: "k0t1", country: "GBR" },
  "Solana Sierra": { name: "Solana Sierra", code: "s0s1", country: "ARG" },
  "Cristina Bucsa": { name: "Cristina Bucsa", code: "b0c1", country: "ESP" },
  "Antonia Ruzic": { name: "Antonia Ruzic", code: "r0z1", country: "CRO" },
  "Olga Danilovic": { name: "Olga Danilovic", code: "d0n1", country: "SRB" },
  "Francesca Jones": { name: "Francesca Jones", code: "j0n2", country: "GBR" },
  "Polina Kudermetova": { name: "Polina Kudermetova", code: "k0d1", country: "RUS" },
  "Zeynep Sonmez": { name: "Zeynep Sonmez", code: "s0z1", country: "TUR" },
  "Anna Bondar": { name: "Anna Bondar", code: "b0n1", country: "HUN" },
  "Varvara Gracheva": { name: "Varvara Gracheva", code: "g0r1", country: "FRA" },
  "Camila Osorio": { name: "Camila Osorio", code: "o0s1", country: "COL" },
  "Renata Zarazua": { name: "Renata Zarazua", code: "z0r1", country: "MEX" },
  "Janice Tjen": { name: "Janice Tjen", code: "t0j1", country: "INA" },
  "Sara Bejlek": { name: "Sara Bejlek", code: "b0j1", country: "CZE" },
  "Caty McNally": { name: "Caty McNally", code: "m0c1", country: "USA" },
  "Suzan Lamens": { name: "Suzan Lamens", code: "l0m1", country: "NED" },
  "Ajla Tomljanovic": { name: "Ajla Tomljanovic", code: "t0m1", country: "AUS" },
  "Darja Semenistaja": { name: "Darja Semenistaja", code: "s0m1", country: "LAT" },
  "Elisabetta Cocciaretto": { name: "Elisabetta Cocciaretto", code: "c0c1", country: "ITA" },
  "Ella Seidel": { name: "Ella Seidel", code: "s0d1", country: "GER" },
  "Katie Volynets": { name: "Katie Volynets", code: "v0y1", country: "USA" },
  "Moyuka Uchijima": { name: "Moyuka Uchijima", code: "u0c1", country: "JPN" },
  "Julia Grabher": { name: "Julia Grabher", code: "g0b1", country: "AUT" },
  "Simona Waltert": { name: "Simona Waltert", code: "w0l1", country: "SUI" },
  "Anna Blinkova": { name: "Anna Blinkova", code: "b0l1", country: "RUS" },
  "Dalma Galfi": { name: "Dalma Galfi", code: "g0f1", country: "HUN" },
  "Oksana Selekhmeteva": { name: "Oksana Selekhmeteva", code: "s0k1", country: "RUS" },
  "Veronika Erjavec": { name: "Veronika Erjavec", code: "e0r1", country: "SLO" },
  "Anastasia Zakharova": { name: "Anastasia Zakharova", code: "z0k1", country: "RUS" },
  "Elena-Gabriela Ruse": { name: "Elena-Gabriela Ruse", code: "r0s1", country: "ROU" },
};

// Helper function for fuzzy player name matching
export function findPlayerByName(searchName: string, tour: 'atp' | 'wta' = 'atp'): TennisPlayer | null {
  const players = tour === 'wta' ? wtaPlayers : atpPlayers;
  
  // Exact match first
  if (players[searchName]) {
    return players[searchName];
  }

  // Case-insensitive search
  const lowerSearch = searchName.toLowerCase();
  for (const [key, player] of Object.entries(players)) {
    if (key.toLowerCase() === lowerSearch) {
      return player;
    }
  }

  // Partial match (last name)
  for (const [key, player] of Object.entries(players)) {
    const nameParts = key.toLowerCase().split(' ');
    const searchParts = lowerSearch.split(' ');
    
    // Check if last name matches
    if (nameParts[nameParts.length - 1] === searchParts[searchParts.length - 1]) {
      return player;
    }
  }

  return null;
}
