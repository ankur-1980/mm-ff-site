const TEAM_NAME_SHORT_OVERRIDES: Record<string, string> = {
  'Cleveland Steamers': 'Cleveland Steamer',
  'Return of the Steamers': 'Steamers',
  "Don't Burn the Pigskin": "Don't Burn...",
  "Uncle Rico's Football Academy": 'Uncle Rico',
  "Brett Favre's Dick": "Brett Favre's...",
  "Don't Effing Care Anymore": "Don't Effing...",
  'Mitch Buchannon All-Stars': "Mitch's All-Stars",
  'A Team Has No Name': 'Team Has No Name',
  "Can't Beat This Heart": "Can't Beat This...",
  'Not Barely Better Than Ankur': 'Not Barely...',
  'Smells Like Rotten Puss': 'Smells Like...',
};

export function mapTeamNameShort(teamName: string): string {
  const normalized = teamName.trim();
  if (normalized === '') return teamName;
  return TEAM_NAME_SHORT_OVERRIDES[normalized] ?? teamName;
}
