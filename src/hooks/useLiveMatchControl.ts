import { useCallback, useEffect, useMemo, useState } from 'react';
import { AddLiveEventInput, BracketService } from '../services/bracket.service';
import { BracketMatch, MatchEvent } from '../types/models';

export const useLiveMatchControl = (matchId?: string) => {
  const [match, setMatch] = useState<BracketMatch | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      setError('Match id is missing');
      return;
    }

    setLoading(true);
    setError(null);

    let gotMatch = false;
    let gotEvents = false;

    const markLoadedIfReady = () => {
      if (gotMatch && gotEvents) {
        setLoading(false);
      }
    };

    const unsubscribeMatch = BracketService.onBracketMatchChange(matchId, (nextMatch) => {
      setMatch(nextMatch);
      gotMatch = true;
      markLoadedIfReady();
    });

    const unsubscribeEvents = BracketService.onMatchEventsChange(matchId, (nextEvents) => {
      setEvents(nextEvents);
      gotEvents = true;
      markLoadedIfReady();
    });

    return () => {
      unsubscribeMatch();
      unsubscribeEvents();
    };
  }, [matchId]);

  const executeAction = useCallback(async (action: () => Promise<void>) => {
    setActionLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update live match';
      setError(message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const startMatch = useCallback(
    async (actorId?: string) => executeAction(() => BracketService.startMatchLive(matchId!, actorId)),
    [executeAction, matchId]
  );

  const setBreak = useCallback(
    async (minute: number, note?: string, actorId?: string) =>
      executeAction(() => BracketService.setMatchOnBreak(matchId!, minute, note, actorId)),
    [executeAction, matchId]
  );

  const resumeMatch = useCallback(
    async (minute: number, note?: string, actorId?: string) =>
      executeAction(() => BracketService.resumeMatchLive(matchId!, minute, note, actorId)),
    [executeAction, matchId]
  );

  const stopMatch = useCallback(
    async (minute: number, note?: string, actorId?: string) =>
      executeAction(() => BracketService.stopMatchLive(matchId!, minute, note, actorId)),
    [executeAction, matchId]
  );

  const addEvent = useCallback(
    async (payload: AddLiveEventInput, actorId?: string) =>
      executeAction(() => BracketService.addLiveEvent(matchId!, payload, actorId)),
    [executeAction, matchId]
  );

  const adjustScore = useCallback(
    async (team1Score: number, team2Score: number, minute: number, actorId?: string) =>
      executeAction(() =>
        BracketService.updateLiveScore(matchId!, team1Score, team2Score, minute, actorId)
      ),
    [executeAction, matchId]
  );

  const confirmFinalResult = useCallback(
    async (tournamentId: string) =>
      executeAction(() => BracketService.confirmFinalResult(matchId!, tournamentId)),
    [executeAction, matchId]
  );

  const liveScore = useMemo(() => {
    if (!match) {
      return { team1: 0, team2: 0 };
    }

    if (match.liveScore) {
      return {
        team1: match.liveScore.team1 || 0,
        team2: match.liveScore.team2 || 0,
      };
    }

    if (match.result) {
      return {
        team1: match.result.team1Score || 0,
        team2: match.result.team2Score || 0,
      };
    }

    return { team1: 0, team2: 0 };
  }, [match]);

  return {
    match,
    events,
    loading,
    actionLoading,
    error,
    liveScore,
    startMatch,
    setBreak,
    resumeMatch,
    stopMatch,
    addEvent,
    adjustScore,
    confirmFinalResult,
  };
};
