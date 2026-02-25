const fs = require('fs');
const path = require('path');

function makeEntry(season, week, id, t1Name, t1Score, t2Name, t2Score) {
  return {
    season,
    week,
    teamId: String(id),
    matchup: {
      team1Id: String(id),
      team1Name: t1Name,
      team1Score: String(t1Score),
      team2Id: String(id + 100),
      team2Name: t2Name,
      team2Score: String(t2Score),
    },
    team1Totals: {
      totalPoints: t1Score,
      totalProjected: 0,
      benchPoints: 0,
      benchProjected: 0,
    },
    team1Roster: [],
  };
}

function makeWeek(season, weekNum, games) {
  const obj = {};
  games.forEach((g, i) => {
    obj[`teamId-${i + 1}`] = makeEntry(season, weekNum, i + 1, g[0], g[1], g[2], g[3]);
  });
  return obj;
}

const historical = {
  '2006': {
    week14: makeWeek(2006, 14, [
      ['Hedd Hunters', 104.40, 'Desi Pride', 66.70],
      ['Da Squad', 118.70, 'Cleveland Steamers', 113.00],
      ["Don't Burn the Pigskin", 106.00, 'ESSENTIALLY\u2026', 89.60],
      ['Gavin A', 133.40, 'The Professor', 113.90],
    ]),
    week15: makeWeek(2006, 15, [
      ["Uncle Rico's Football Academy", 145.80, 'Da Squad', 64.60],
      ['TheStevens', 92.40, 'Hedd Hunters', 49.90],
    ]),
    week16: makeWeek(2006, 16, [
      ['TheStevens', 122.30, "Uncle Rico's Football Academy", 80.80],
      ['Gavin A', 95.90, "Don't Burn the Pigskin", 64.20],
    ]),
  },
  '2007': {
    week14: makeWeek(2007, 14, [
      ['Famous Titles', 125.10, 'Cleveland Steamers', 116.00],
      ['Big Dogs', 107.00, 'Hedd Hunters', 104.00],
      ['The Mitch Buchannon All-Stars', 115.20, 'Da Squad', 65.40],
      ['Desi Pride', 137.80, 'Gavin A', 62.80],
    ]),
    week15: makeWeek(2007, 15, [
      ['Big Dogs', 102.10, "Uncle Rico's Football Academy", 101.60],
      ["Don't Burn the Pigskin", 121.30, 'Famous Titles', 99.30],
    ]),
    week16: makeWeek(2007, 16, [
      ['Big Dogs', 107.50, "Don't Burn the Pigskin", 100.90],
      ['The Mitch Buchannon All-Stars', 82.30, 'Desi Pride', 60.50],
    ]),
  },
  '2008': {
    week14: makeWeek(2008, 14, [
      ['Big Dogs', 120.90, 'Famous Titles', 116.00],
      ['Gavin A', 99.90, 'The Mitch Buchannon All-Stars', 74.00],
      ["Uncle Rico's Football Academy", 100.40, 'Desi Pride', 93.30],
      ['Return of the Steamers', 90.80, "Show Me Your TD's", 75.60],
    ]),
    week15: makeWeek(2008, 15, [
      ['Da Squad', 90.40, 'Gavin A', 87.20],
      ['Big Dogs', 116.40, 'Hedd Hunters', 99.80],
    ]),
    week16: makeWeek(2008, 16, [
      ['Big Dogs', 120.90, 'Da Squad', 113.70],
      ["Uncle Rico's Football Academy", 117.90, 'Return of the Steamers', 111.80],
    ]),
  },
  '2009': {
    week14: makeWeek(2009, 14, [
      ['Da Squad', 114.30, "Jr Peporium's Wonder Emporium", 92.80],
      ['Big Dogs', 101.30, 'Return of the Steamers', 93.60],
      ["Show Me Your TD's", 96.80, "Uncle Rico's Football Academy", 78.10],
      ['Hedd Hunters', 109.70, 'Desi Pride', 104.90],
    ]),
    week15: makeWeek(2009, 15, [
      ['Famous Titles', 113.60, 'Big Dogs', 80.90],
      ['Da Squad', 116.00, 'The Mitch Buchannon All-Stars', 91.90],
    ]),
    week16: makeWeek(2009, 16, [
      ['Da Squad', 99.60, 'Famous Titles', 93.70],
      ["Show Me Your TD's", 102.70, 'Hedd Hunters', 88.60],
    ]),
  },
  '2010': {
    week14: makeWeek(2010, 14, [
      ['Da Squad', 115.80, "Uncle Rico's Football Academy", 90.20],
      ["Show Me Your TD's", 93.10, "Brett Favre's Dick", 82.80],
      ["Jr Peporium's Wonder Emporium", 84.60, 'Hedd Hunters', 52.70],
      ['Big Dogs', 94.50, 'Desi Pride', 68.30],
    ]),
    week15: makeWeek(2010, 15, [
      ['Return of the Steamers', 120.40, "Show Me Your TD's", 88.30],
      ['Da Squad', 124.60, 'Famous Titles', 68.30],
    ]),
    week16: makeWeek(2010, 16, [
      ['Da Squad', 93.50, 'Return of the Steamers', 84.10],
      ["Jr Peporium's Wonder Emporium", 104.30, 'Big Dogs', 87.10],
    ]),
  },
  '2011': {
    week14: makeWeek(2011, 14, [
      ['Big Dogs', 162.50, "Don't Effing Care Anymore", 134.90],
      ["Uncle Rico's Football Academy", 167.00, 'Da Squad', 132.80],
      ['Famous Titles', 97.80, 'Hedd Hunters', 80.50],
      ['The Flaming Pepper', 111.70, "Millen's Minions", 105.50],
    ]),
    week15: makeWeek(2011, 15, [
      ["Show Me Your TD's", 87.10, "Uncle Rico's Football Academy", 78.40],
      ['Return of the Steamers', 129.00, 'Big Dogs', 106.40],
    ]),
    week16: makeWeek(2011, 16, [
      ['Return of the Steamers', 113.60, "Show Me Your TD's", 105.20],
      ['Famous Titles', 103.60, 'The Flaming Pepper', 91.00],
    ]),
  },
};

const filePath = path.join(__dirname, '../src/assets/data/weekly_matchups-data.json');
const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const merged = { ...historical, ...existing };
fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
console.log('Done. Seasons now:', Object.keys(merged).sort().join(', '));
