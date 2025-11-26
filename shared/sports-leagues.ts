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
      { id: "4344", name: "Portuguese Primeira Liga", displayName: "Primeira Liga", badge: "https://r2.thesportsdb.com/images/media/league/badge/870t5o1679952107.png" },
      { id: "4337", name: "Eredivisie", displayName: "Eredivisie", badge: "https://r2.thesportsdb.com/images/media/league/badge/3ixmq01681492239.png" },
      { id: "4346", name: "Scottish Premiership", displayName: "Scottish Premiership", badge: "https://r2.thesportsdb.com/images/media/league/badge/x1h9vp1549406491.png" },
      { id: "4351", name: "Brazilian Serie A", displayName: "Serie A Brasil", badge: "https://r2.thesportsdb.com/images/media/league/badge/txm4kn1679952183.png" },
      { id: "4359", name: "Argentine Primera Division", displayName: "Argentina Primera", badge: "https://r2.thesportsdb.com/images/media/league/badge/wtxyqx1679952243.png" },
      { id: "4350", name: "MLS", displayName: "MLS", badge: "https://r2.thesportsdb.com/images/media/league/badge/rmxy8c1679951948.png" },
      { id: "4482", name: "UEFA Conference League", displayName: "Conference League", badge: "https://r2.thesportsdb.com/images/media/league/badge/q3rj2i1633699956.png" },
      { id: "4483", name: "Copa Libertadores", displayName: "Copa Libertadores", badge: "https://r2.thesportsdb.com/images/media/league/badge/7y6zvn1679952353.png" },
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
      { id: "4546", name: "EuroLeague Basketball", displayName: "EuroLeague", badge: "https://r2.thesportsdb.com/images/media/league/badge/7xjtuy1554397263.png" },
      { id: "4607", name: "NCAA Basketball", displayName: "NCAA Basketball", badge: "https://r2.thesportsdb.com/images/media/league/badge/xyyggz1549936127.png" },
      { id: "4547", name: "Spanish Liga ACB", displayName: "Liga ACB", badge: "https://r2.thesportsdb.com/images/media/league/badge/7sqpup1554397542.png" },
      { id: "4545", name: "Australian NBL", displayName: "NBL Australia", badge: "https://r2.thesportsdb.com/images/media/league/badge/qfslqx1554397114.png" },
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
      { id: "4408", name: "CFL", displayName: "CFL", badge: "https://r2.thesportsdb.com/images/media/league/badge/rvvqsw1423669461.png" },
      { id: "5065", name: "XFL", displayName: "XFL", badge: "https://r2.thesportsdb.com/images/media/league/badge/rmu5851612374286.png" },
    ],
  },
  {
    id: "baseball",
    name: "Baseball",
    iconName: "baseball",
    iconType: "svg",
    leagues: [
      { id: "4424", name: "MLB", displayName: "MLB", badge: "https://r2.thesportsdb.com/images/media/league/badge/l4xbmn1730395399.png" },
      { id: "4430", name: "NPB", displayName: "NPB Japan", badge: "https://r2.thesportsdb.com/images/media/league/badge/xsxwuy1424363798.png" },
      { id: "4431", name: "KBO", displayName: "KBO Korea", badge: "https://r2.thesportsdb.com/images/media/league/badge/0f0zn01551203232.png" },
    ],
  },
  {
    id: "ice-hockey",
    name: "Ice Hockey",
    iconName: "hockey",
    iconType: "svg",
    leagues: [
      { id: "4380", name: "NHL", displayName: "NHL", badge: "https://r2.thesportsdb.com/images/media/league/badge/fg2ovx1692630553.png" },
      { id: "4600", name: "KHL", displayName: "KHL", badge: "https://r2.thesportsdb.com/images/media/league/badge/xwxvsy1554398018.png" },
      { id: "4379", name: "Swedish Hockey League", displayName: "SHL", badge: "https://r2.thesportsdb.com/images/media/league/badge/qwxvqy1579023108.png" },
    ],
  },
  {
    id: "tennis",
    name: "Tennis",
    iconName: "tennis",
    iconType: "svg",
    leagues: [
      { id: "4464", name: "ATP World Tour", displayName: "ATP Tour", badge: "https://r2.thesportsdb.com/images/media/team/badge/cav6c81546113141.png" },
      { id: "4421", name: "WTA Tour", displayName: "WTA Tour", badge: "https://r2.thesportsdb.com/images/media/league/badge/qgvsmy1753208524.png" },
      { id: "4465", name: "Australian Open", displayName: "Australian Open", badge: "https://r2.thesportsdb.com/images/media/league/badge/rnqr2t1423678697.png" },
      { id: "4466", name: "French Open", displayName: "Roland Garros", badge: "https://r2.thesportsdb.com/images/media/league/badge/uqxqv41423678832.png" },
      { id: "4467", name: "Wimbledon", displayName: "Wimbledon", badge: "https://r2.thesportsdb.com/images/media/league/badge/f3f5r81694003858.png" },
      { id: "4468", name: "US Open Tennis", displayName: "US Open", badge: "https://r2.thesportsdb.com/images/media/league/badge/8fnm5q1694004141.png" },
    ],
  },
  {
    id: "mma",
    name: "MMA / Boxing",
    iconName: "boxing",
    iconType: "svg",
    leagues: [
      { id: "4443", name: "UFC", displayName: "UFC", badge: "https://r2.thesportsdb.com/images/media/league/badge/r8vbq81578951945.png" },
      { id: "4472", name: "Bellator MMA", displayName: "Bellator", badge: "https://r2.thesportsdb.com/images/media/league/badge/0y4tit1578952059.png" },
      { id: "4473", name: "ONE Championship", displayName: "ONE FC", badge: "https://r2.thesportsdb.com/images/media/league/badge/wy8kqf1578952135.png" },
      { id: "4471", name: "Boxing", displayName: "Boxing", badge: "https://r2.thesportsdb.com/images/media/league/badge/sxtxfy1537875671.png" },
    ],
  },
  {
    id: "rugby",
    name: "Rugby",
    iconName: "rugby",
    iconType: "svg",
    leagues: [
      { id: "4405", name: "Super Rugby", displayName: "Super Rugby", badge: "https://r2.thesportsdb.com/images/media/league/badge/88qtfv1554398397.png" },
      { id: "4401", name: "English Premiership Rugby", displayName: "Premiership Rugby", badge: "https://r2.thesportsdb.com/images/media/league/badge/dv95901536071183.png" },
      { id: "4402", name: "Top 14", displayName: "Top 14", badge: "https://r2.thesportsdb.com/images/media/league/badge/upyrx51536071283.png" },
      { id: "4416", name: "NRL", displayName: "NRL Australia", badge: "https://r2.thesportsdb.com/images/media/league/badge/rvxywq1536071454.png" },
      { id: "4418", name: "Six Nations", displayName: "Six Nations", badge: "https://r2.thesportsdb.com/images/media/league/badge/8r8dvj1580834652.png" },
    ],
  },
  {
    id: "cricket",
    name: "Cricket",
    iconName: "cricket",
    iconType: "svg",
    leagues: [
      { id: "4453", name: "IPL", displayName: "IPL", badge: "https://r2.thesportsdb.com/images/media/league/badge/7ajxsj1641464455.png" },
      { id: "4455", name: "Big Bash League", displayName: "BBL", badge: "https://r2.thesportsdb.com/images/media/league/badge/cxdq8e1641464642.png" },
      { id: "4454", name: "The Hundred", displayName: "The Hundred", badge: "https://r2.thesportsdb.com/images/media/league/badge/h5yf3k1641464544.png" },
      { id: "4517", name: "ICC Cricket World Cup", displayName: "Cricket World Cup", badge: "https://r2.thesportsdb.com/images/media/league/badge/w5xwry1573245011.png" },
    ],
  },
  {
    id: "golf",
    name: "Golf",
    iconName: "golf",
    iconType: "svg",
    leagues: [
      { id: "4419", name: "PGA Tour", displayName: "PGA Tour", badge: "https://r2.thesportsdb.com/images/media/league/badge/qrqxhj1580834729.png" },
      { id: "4458", name: "DP World Tour", displayName: "DP World Tour", badge: "https://r2.thesportsdb.com/images/media/league/badge/xqrrt61580834798.png" },
      { id: "4520", name: "LIV Golf", displayName: "LIV Golf", badge: "https://r2.thesportsdb.com/images/media/league/badge/f7k5mt1655826437.png" },
    ],
  },
  {
    id: "motorsport",
    name: "Motor Sport",
    iconName: "racing",
    iconType: "svg",
    leagues: [
      { id: "4370", name: "Formula 1", displayName: "F1", badge: "https://r2.thesportsdb.com/images/media/league/badge/1j5xb91617376376.png" },
      { id: "4373", name: "NASCAR", displayName: "NASCAR", badge: "https://r2.thesportsdb.com/images/media/league/badge/d4m5rr1554399665.png" },
      { id: "4372", name: "MotoGP", displayName: "MotoGP", badge: "https://r2.thesportsdb.com/images/media/league/badge/uthyut1554399599.png" },
      { id: "4518", name: "Formula E", displayName: "Formula E", badge: "https://r2.thesportsdb.com/images/media/league/badge/qx02ze1573245148.png" },
      { id: "4371", name: "IndyCar", displayName: "IndyCar", badge: "https://r2.thesportsdb.com/images/media/league/badge/xquyus1554399517.png" },
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
