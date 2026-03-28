import { useEffect, useState, useCallback } from 'react';
import { BracketService } from '../services/bracket.service';
import { TournamentService } from '../services/tournament.service';
import {
  Tournament,
  BracketMatch,
  TournamentStats,
  BracketTeam,
} from '../types/models';

export const useTournament = (tournamentId: string) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTournament = async () => {
      try {
        setLoading(true);
        const data = await TournamentService.getTournament(tournamentId);
        setTournament(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [tournamentId]);

  return { tournament, loading, error };
};

export const useBracket = (tournamentId: string, autoRefresh = false) => {
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBracket = useCallback(async () => {
    try {
      setLoading(true);
      const [bracketData, statsData] = await Promise.all([
        BracketService.getBracket(tournamentId),
        BracketService.getTournamentStats(tournamentId),
      ]);

      setBracket(bracketData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bracket');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadBracket();

    if (autoRefresh) {
      const interval = setInterval(loadBracket, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [loadBracket, autoRefresh]);

  return { bracket, stats, loading, error, refetch: loadBracket };
};

export const useBracketTeams = (tournamentId: string) => {
  const [teams, setTeams] = useState<BracketTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const data = await BracketService.getRegisteredTeams(tournamentId);
        setTeams(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [tournamentId]);

  return { teams, loading, error };
};

export const useUpdateMatchResult = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateResult = useCallback(
    async (
      matchId: string,
      team1Score: number,
      team2Score: number,
      tournamentId: string
    ) => {
      try {
        setLoading(true);
        await BracketService.updateMatchResult(
          matchId,
          team1Score,
          team2Score,
          tournamentId
        );
        setError(null);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update match';
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateResult, loading, error };
};

export const useTournamentList = (
  filters?: { sport?: string; status?: string; location?: string },
  pageSize = 10
) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);

  const loadTournaments = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const { tournaments: data, lastVisible: newLastVisible } =
        await TournamentService.getTournaments(
          filters as any,
          pageSize,
          reset ? null : lastVisible
        );

      if (reset) {
        setTournaments(data);
      } else {
        setTournaments((prev) => [...prev, ...data]);
      }

      setLastVisible(newLastVisible);
      setHasMore(!!newLastVisible);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, lastVisible]);

  useEffect(() => {
    loadTournaments(true);
  }, []);

  return {
    tournaments,
    loading,
    error,
    hasMore,
    loadMore: () => loadTournaments(false),
  };
};
