import type { PlayerId } from '@night-has-come/contracts';

import type { GameState, VoteState, VoteResult } from '../state/index.js';

// ─── Voting System ──────────────────────────────────────────────────

/**
 * Create a new vote session for a nomination.
 */
export function createVoteSession(
  state: GameState,
  nominatorId: PlayerId,
  nomineeId: PlayerId,
): VoteState {
  return {
    nominationId: crypto.randomUUID(),
    nominatorId,
    nomineeId,
    defenseStatement: null,
    votes: new Map(),
    locked: false,
    startedAt: new Date().toISOString(),
    lockedAt: null,
    result: null,
    runoffCount: 0,
  };
}

/**
 * Cast a vote.
 */
export function castVote(
  voteState: VoteState,
  voterId: string,
  targetId: string | null, // null = abstain
): { success: boolean; error: string | null } {
  if (voteState.locked) {
    return { success: false, error: 'Vote is locked' };
  }

  // Cannot vote twice in the same session (abstain can be changed)
  if (voteState.votes.has(voterId) && targetId !== null) {
    return { success: false, error: 'Already voted' };
  }

  voteState.votes.set(voterId, targetId);
  return { success: true, error: null };
}

/**
 * Lock the vote and compute results.
 */
export function lockVote(voteState: VoteState): VoteState {
  voteState.locked = true;
  voteState.lockedAt = new Date().toISOString();
  voteState.result = computeVoteResult(voteState);
  return voteState;
}

/**
 * Compute vote results deterministically.
 */
export function computeVoteResult(voteState: VoteState): VoteResult {
  const votesByTarget = new Map<string | null, number>();

  for (const [, target] of voteState.votes) {
    const key = target;
    votesByTarget.set(key, (votesByTarget.get(key) ?? 0) + 1);
  }

  // Find the maximum votes
  let maxVotes = 0;
  let topCandidates: (string | null)[] = [];

  for (const [target, count] of votesByTarget) {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidates = [target];
    } else if (count === maxVotes) {
      topCandidates.push(target);
    }
  }

  // No votes case
  if (maxVotes === 0) {
    return {
      eliminatedId: null,
      tiedPlayerIds: [],
      isRunoff: false,
      isNoElimination: true,
      votesByTarget: votesByTarget as Map<string | null, number>,
    };
  }

  // Clear winner
  const winner = topCandidates[0];
  if (topCandidates.length === 1 && winner !== null && winner !== undefined) {
    return {
      eliminatedId: winner,
      tiedPlayerIds: [],
      isRunoff: false,
      isNoElimination: false,
      votesByTarget: votesByTarget as Map<string | null, number>,
    };
  }

  // Abstain won
  if (topCandidates.length === 1 && topCandidates[0] === null) {
    return {
      eliminatedId: null,
      tiedPlayerIds: [],
      isRunoff: false,
      isNoElimination: true,
      votesByTarget: votesByTarget as Map<string | null, number>,
    };
  }

  // Tie among players
  if (topCandidates.length > 1) {
    const tiedIds = topCandidates.filter((c): c is string => c !== null);
    if (tiedIds.length === 0) {
      return {
        eliminatedId: null,
        tiedPlayerIds: [],
        isRunoff: false,
        isNoElimination: true,
        votesByTarget: votesByTarget as Map<string | null, number>,
      };
    }

    // Check max runoffs
    if (voteState.runoffCount >= 2) {
      return {
        eliminatedId: null,
        tiedPlayerIds: tiedIds,
        isRunoff: false,
        isNoElimination: true,
        votesByTarget: votesByTarget as Map<string | null, number>,
      };
    }

    return {
      eliminatedId: null,
      tiedPlayerIds: tiedIds,
      isRunoff: true,
      isNoElimination: false,
      votesByTarget: votesByTarget as Map<string | null, number>,
    };
  }

  return {
    eliminatedId: null,
    tiedPlayerIds: [],
    isRunoff: false,
    isNoElimination: true,
    votesByTarget: votesByTarget as Map<string | null, number>,
  };
}

/**
 * Get the majority threshold for a given alive player count.
 */
export function getMajorityThreshold(aliveCount: number): number {
  return Math.floor(aliveCount / 2) + 1;
}
