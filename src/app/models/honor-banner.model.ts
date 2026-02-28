import type { MatchupTeam } from './matchup.model';

export type HonorType = 'premier' | 'consolation' | 'runnerUp';

export interface HonorBannerMatchup {
  team1: MatchupTeam;
  team2: MatchupTeam;
  note?: string;
}

export interface HonorBannerData {
  type: HonorType;
  ownerName: string;
  teamName: string;
  year: number;
  record: string;
  matchup?: HonorBannerMatchup;
}
