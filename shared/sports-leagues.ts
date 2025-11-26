export interface League {
  id: string;
  name: string;
  displayName: string;
  badge?: string;
}

export interface Sport {
  id: string;
  name: string;
  iconName: string;
  iconType?: 'lucide' | 'svg' | 'custom';
  leagues: League[];
}

export const sportsData: Sport[] = [
  {
    id: "soccer",
    name: "Football",
    iconName: "soccer",
    iconType: "svg",
    leagues: [
      { id: "4328", name: "English Premier League", displayName: "EPL", badge: "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png" },
      { id: "4335", name: "Spanish La Liga", displayName: "La Liga", badge: "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png" },
      { id: "4331", name: "German Bundesliga", displayName: "Bundesliga", badge: "https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png" },
      { id: "4332", name: "Italian Serie A", displayName: "Serie A", badge: "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png" },
      { id: "4334", name: "French Ligue 1", displayName: "Ligue 1", badge: "https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png" },
      { id: "4480", name: "UEFA Champions League", displayName: "UCL", badge: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png" },
      { id: "4481", name: "UEFA Europa League", displayName: "Europa League", badge: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png" },
    ],
  },
  {
    id: "basketball",
    name: "Basketball",
    iconName: "basketball",
    iconType: "svg",
    leagues: [
      { id: "4387", name: "NBA", displayName: "NBA", badge: "https://r2.thesportsdb.com/images/media/league/badge/frdjqy1536585083.png" },
      { id: "4516", name: "WNBA", displayName: "WNBA", badge: "https://r2.thesportsdb.com/images/media/league/badge/47llb31573154455.png" },
      { id: "4546", name: "EuroLeague Basketball", displayName: "EuroLeague Basketball", badge: "https://r2.thesportsdb.com/images/media/league/badge/7xjtuy1554397263.png" },
    ],
  },
  {
    id: "american-football",
    name: "American Football",
    iconName: "american-football",
    iconType: "svg",
    leagues: [
      { id: "4391", name: "NFL", displayName: "NFL", badge: "https://r2.thesportsdb.com/images/media/league/badge/phl2351549809367.png" },
      { id: "4479", name: "NCAA Football", displayName: "NCAA Football", badge: "https://r2.thesportsdb.com/images/media/league/badge/xyyggz1549936127.png" },
    ],
  },
  {
    id: "baseball",
    name: "Baseball",
    iconName: "baseball",
    iconType: "svg",
    leagues: [
      { id: "4424", name: "MLB", displayName: "MLB", badge: "https://r2.thesportsdb.com/images/media/league/badge/l4xbmn1730395399.png" },
    ],
  },
  {
    id: "ice-hockey",
    name: "Ice Hockey",
    iconName: "hockey",
    iconType: "svg",
    leagues: [
      { id: "4380", name: "NHL", displayName: "NHL", badge: "https://r2.thesportsdb.com/images/media/league/badge/fg2ovx1692630553.png" },
    ],
  },
  {
    id: "tennis",
    name: "Tennis",
    iconName: "tennis",
    iconType: "svg",
    leagues: [
      { id: "4464", name: "ATP World Tour", displayName: "ATP World Tour", badge: "https://r2.thesportsdb.com/images/media/team/badge/cav6c81546113141.png" },
      { id: "4421", name: "WTA Tour", displayName: "WTA Tour", badge: "https://r2.thesportsdb.com/images/media/league/badge/qgvsmy1753208524.png" },
    ],
  },
  {
    id: "cs2",
    name: "Counter Strike",
    iconName: "cs2",
    iconType: "custom",
    leagues: [
      { id: "5426", name: "Blast Premier", displayName: "Blast Premier", badge: "https://r2.thesportsdb.com/images/media/league/badge/6cg6vm1748428090.png" },
      { id: "5425", name: "ESL Pro League", displayName: "ESL Pro League", badge: "https://r2.thesportsdb.com/images/media/league/badge/iwnm681705172445.png" },
    ],
  },
  {
    id: "dota2",
    name: "Dota 2",
    iconName: "dota2",
    iconType: "custom",
    leagues: [
      { id: "dota2-1", name: "The International", displayName: "The International", badge: "https://liquipedia.net/commons/images/c/c2/The_International_lightmode.png" },
      { id: "dota2-2", name: "Dota Pro Circuit", displayName: "DPC", badge: "https://liquipedia.net/commons/images/5/5c/Dota_Pro_Circuit_2021_lightmode.png" },
    ],
  },
  {
    id: "valorant",
    name: "Valorant",
    iconName: "valorant",
    iconType: "custom",
    leagues: [
      { id: "5422", name: "Valorant Champions Tour", displayName: "VCT", badge: "https://r2.thesportsdb.com/images/media/league/badge/ihvdp41748984192.png" },
    ],
  },
  {
    id: "lol",
    name: "League of Legends",
    iconName: "lol",
    iconType: "custom",
    leagues: [
      { id: "4514", name: "League of Legends World Championship", displayName: "Worlds", badge: "https://r2.thesportsdb.com/images/media/league/badge/v60b971706041095.png" },
      { id: "4529", name: "League of Legends Champions Korea", displayName: "LCK", badge: "https://r2.thesportsdb.com/images/media/league/badge/llpp2i1705953103.png" },
    ],
  },
  {
    id: "esports",
    name: "ESports",
    iconName: "Gamepad2",
    leagues: [
      { id: "4715", name: "Call of Duty League", displayName: "Call of Duty League", badge: "https://r2.thesportsdb.com/images/media/league/badge/oirs421581113488.png" },
      { id: "4717", name: "Overwatch League", displayName: "Overwatch League", badge: "https://r2.thesportsdb.com/images/media/league/badge/7w4mgw1581158134.png" },
    ],
  },
];
