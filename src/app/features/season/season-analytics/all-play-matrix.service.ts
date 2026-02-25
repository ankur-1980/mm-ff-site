import { inject, Injectable } from '@angular/core';

import type { AllPlayMatrixResult, AllPlayPairRecord } from './all-play-matrix.models';
import { LeagueMetaDataService } from '../../../data/league-metadata.service';
import { WeeklyMatchupsDataService } from '../../../data/weekly-matchups-data.service';

const EPSILON = 0.000_001;

function normalizeKey(name: string): string {
  return name != null ? String(name).trim().toLowerCase() : '';
}

@Injectable({ providedIn: 'root' })
export class AllPlayMatrixService {
  private readonly weeklyMatchups = inject(WeeklyMatchupsDataService);
  private readonly leagueMeta = inject(LeagueMetaDataService);

  /**
   * Build the all-play matrix for a season: each cell is the record (W-L-T)
   * the row team would have against the column team if they played every regular-season week.
   */
  buildMatrix(seasonId: string): AllPlayMatrixResult | null {
    const meta = this.leagueMeta.getSeasonMeta(seasonId);
    if (!meta) return null;

    const season = this.weeklyMatchups.getSeasonWeeks(seasonId);
    if (!season) return null;

    // Use actual week keys in the data, limited to regular season (week number <= regularSeasonEndWeek)
    const allWeekKeys = this.weeklyMatchups.getWeekKeysForSeason(seasonId);
    const regularSeasonWeekKeys = allWeekKeys.filter((key) => {
      const num = parseInt(key.replace(/\D/g, ''), 10);
      return !Number.isNaN(num) && num >= 1 && num <= meta.regularSeasonEndWeek;
    });

    // Collect weekly scores: week number -> normalizedTeamName -> points
    const weeklyScoresByTeam = new Map<number, Map<string, number>>();
    const teamDisplayNames = new Map<string, string>(); // normalized -> display name (first seen)

    for (const weekKey of regularSeasonWeekKeys) {
      const weekData = season[weekKey];
      if (!weekData) continue;

      const weekNum = parseInt(weekKey.replace(/\D/g, ''), 10);
      const weekMap = new Map<string, number>();
      for (const entry of Object.values(weekData)) {
        const name = entry?.matchup?.team1Name;
        if (name == null || String(name).trim() === '') continue;
        const points = entry?.team1Totals?.totalPoints ?? 0;
        const key = normalizeKey(name);
        weekMap.set(key, points);
        if (!teamDisplayNames.has(key)) {
          teamDisplayNames.set(key, String(name).trim());
        }
      }
      if (weekMap.size > 0) {
        weeklyScoresByTeam.set(weekNum, weekMap);
      }
    }

    const weeks = Array.from(weeklyScoresByTeam.keys()).sort((a, b) => a - b);
    if (weeks.length === 0) return null;

    const allTeams = Array.from(teamDisplayNames.keys());
    // Pair record: key "row|col" -> { wins, losses, ties } from row's perspective
    const pairRecords = new Map<string, AllPlayPairRecord>();

    for (const rowKey of allTeams) {
      for (const colKey of allTeams) {
        if (rowKey === colKey) {
          pairRecords.set(`${rowKey}|${colKey}`, { wins: 0, losses: 0, ties: 0 });
          continue;
        }
        let wins = 0;
        let losses = 0;
        let ties = 0;
        for (const week of weeks) {
          const weekMap = weeklyScoresByTeam.get(week)!;
          const rowScore = weekMap.get(rowKey);
          const colScore = weekMap.get(colKey);
          if (rowScore == null || colScore == null) continue;
          const diff = rowScore - colScore;
          if (diff > EPSILON) wins += 1;
          else if (diff < -EPSILON) losses += 1;
          else ties += 1;
        }
        pairRecords.set(`${rowKey}|${colKey}`, { wins, losses, ties });
      }
    }

    // Order teams by total all-play wins (descending) for display
    const totalWins = new Map<string, number>();
    for (const key of allTeams) {
      let sum = 0;
      for (const other of allTeams) {
        if (other === key) continue;
        const r = pairRecords.get(`${key}|${other}`)!;
        sum += r.wins;
      }
      totalWins.set(key, sum);
    }
    const teamNames = [...allTeams].sort((a, b) => (totalWins.get(b) ?? 0) - (totalWins.get(a) ?? 0))
      .map((key) => teamDisplayNames.get(key) ?? key);

    const getRecord = (rowTeam: string, colTeam: string): AllPlayPairRecord => {
      const r = normalizeKey(rowTeam);
      const c = normalizeKey(colTeam);
      return pairRecords.get(`${r}|${c}`) ?? { wins: 0, losses: 0, ties: 0 };
    };

    const getTotalRecord = (team: string): AllPlayPairRecord => {
      const key = normalizeKey(team);
      let wins = 0;
      let losses = 0;
      let ties = 0;
      for (const other of allTeams) {
        if (other === key) continue;
        const r = pairRecords.get(`${key}|${other}`) ?? { wins: 0, losses: 0, ties: 0 };
        wins += r.wins;
        losses += r.losses;
        ties += r.ties;
      }
      return { wins, losses, ties };
    };

    return {
      teamNames,
      getRecord,
      getTotalRecord,
      weeksCount: weeks.length,
    };
  }
}
