/**
 * Single owner metadata: consolidated W/L/T, PF/PA, and league participation.
 * Keys in owners-data.json are managerName; use managerName as stable owner id.
 */
export interface Owner {
  managerName: string;
  realName: string;
  seasonsPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  moves: number;
  trades: number;
  playoffAppearances: number;
  championships: number;
  teamNames: string[];
  activeSeasons: number[];
}

/**
 * Raw owners payload: map of owner id (managerName) to Owner.
 */
export type OwnersData = Record<string, Owner>;
