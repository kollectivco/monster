import type { Rapper as DBRapper, Judge as DBJudge, ScoreRow, EventControl } from '../hooks/useRelationalSync';
import type { AppData, BroadcastState, Rapper, Judge, Score } from '../types';

// Convert relational database format to legacy AppData format
export function convertToAppData(
  rappers: DBRapper[],
  judges: DBJudge[],
  scores: ScoreRow[]
): AppData {
  // Extract unique teams from rappers
  const teamsMap = new Map<string, string>();
  rappers.forEach(r => {
    if (!teamsMap.has(r.team)) {
      teamsMap.set(r.team, r.team);
    }
  });

  const teams = Array.from(teamsMap.entries()).map(([name], index) => ({
    id: String(index + 1),
    name,
  }));

  // Convert rappers
  const legacyRappers: Rapper[] = rappers.map(r => {
    const teamEntry = Array.from(teamsMap.entries()).find(([name]) => name === r.team);
    const teamIndex = teamEntry ? Array.from(teamsMap.keys()).indexOf(teamEntry[0]) : 0;
    return {
      id: r.id,
      name: r.name,
      teamId: String(teamIndex + 1),
    };
  });

  // Convert judges (simpler, just drop slug and sort_order)
  const legacyJudges: Judge[] = judges.map(j => ({
    id: j.id,
    name: j.name,
  }));

  // Convert scores
  const legacyScores: Record<string, Score> = {};
  scores.forEach(s => {
    const key = `${s.judge_id}-${s.rapper_id}-${s.round}`;
    legacyScores[key] = {
      judgeId: s.judge_id,
      rapperId: s.rapper_id,
      round: s.round,
      criteria: [s.lyricism ?? 0, s.flow ?? 0, s.stage ?? 0, s.originality ?? 0, s.impact ?? 0],
      deductions: {
        restart: s.restart ?? false,
        preRecorded: s.prerec ?? false,
        technical: (s.technical ?? 0) as 0 | 1 | 2,
      },
    };
  });

  return {
    teams,
    rappers: legacyRappers,
    judges: legacyJudges,
    scores: legacyScores,
  };
}

// Convert event control to broadcast state
export function convertToBroadcastState(control: EventControl | null): BroadcastState {
  if (!control) {
    return {
      round: 1,
      mode: 'now-performing',
      currentRapperId: null,
      nextRapperId: null,
      showScore: false,
    };
  }

  let mode = control.display_mode as BroadcastState['mode'];
  let timerSeconds: number | undefined;

  // Check if mode has timer encoded like "countdown-timer:300"
  if (control.display_mode && control.display_mode.includes(':')) {
    const [baseMode, timerStr] = control.display_mode.split(':');
    mode = baseMode as BroadcastState['mode'];
    timerSeconds = parseInt(timerStr, 10);
  }

  return {
    round: control.current_round as 1 | 2 | 3,
    mode,
    currentRapperId: control.now_performing,
    nextRapperId: control.next_up,
    showScore: control.show_score,
    timerSeconds,
    wildcardRapperId: control.wildcard_rapper_id,
  };
}

// Convert score updates from legacy format to database format
export function convertScoreUpdate(
  judgeId: string,
  rapperId: string,
  round: number,
  updates: Partial<Score>
): Partial<ScoreRow> & { id: string } {
  const id = `r${round}_${rapperId}_${judgeId}`;

  const result: any = {
    id,
    round,
    rapper_id: rapperId,
    judge_id: judgeId,
  };

  if (updates.criteria) {
    result.lyricism = updates.criteria[0];
    result.flow = updates.criteria[1];
    result.stage = updates.criteria[2];
    result.originality = updates.criteria[3];
    result.impact = updates.criteria[4];
  }

  if (updates.deductions) {
    if (updates.deductions.restart !== undefined) {
      result.restart = updates.deductions.restart;
    }
    if (updates.deductions.preRecorded !== undefined) {
      result.prerec = updates.deductions.preRecorded;
    }
    if (updates.deductions.technical !== undefined) {
      result.technical = updates.deductions.technical;
    }
  }

  return result;
}

// Convert broadcast state updates to event control format
export function convertBroadcastUpdate(updates: Partial<BroadcastState>): Partial<EventControl> {
  const result: any = {};

  if (updates.round !== undefined) {
    result.current_round = updates.round;
  }
  
  if (updates.mode !== undefined) {
    if (updates.timerSeconds !== undefined) {
      result.display_mode = `${updates.mode}:${updates.timerSeconds}`;
    } else {
      result.display_mode = updates.mode;
    }
  } else if (updates.timerSeconds !== undefined) {
    // If we only got a timer update, we don't know the mode here. 
    // This is a limitation, but BroadcastControl usually sends mode alongside timer
  }

  if (updates.currentRapperId !== undefined) {
    result.now_performing = updates.currentRapperId;
  }
  if (updates.nextRapperId !== undefined) {
    result.next_up = updates.nextRapperId;
  }
  if (updates.showScore !== undefined) {
    result.show_score = updates.showScore;
  }
  if (updates.wildcardRapperId !== undefined) {
    result.wildcard_rapper_id = updates.wildcardRapperId;
  }

  return result;
}
