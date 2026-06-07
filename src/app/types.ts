export interface Team {
  id: string;
  name: string;
}

export interface Rapper {
  id: string;
  name: string;
  teamId: string;
}

export interface Judge {
  id: string;
  name: string;
}

export interface Score {
  judgeId: string;
  rapperId: string;
  round: number;
  criteria: [number, number, number, number, number];
  deductions: {
    restart: boolean;
    preRecorded: boolean;
    technical: 0 | 1 | 2;
  };
}

export interface AppData {
  teams: Team[];
  rappers: Rapper[];
  judges: Judge[];
  scores: Record<string, Score>;
}

export interface BroadcastState {
  round: 1 | 2 | 3;
  mode: 'now-performing' | 'round-standings' | 'podium';
  currentRapperId: string | null;
  nextRapperId: string | null;
  showScore: boolean;
}
