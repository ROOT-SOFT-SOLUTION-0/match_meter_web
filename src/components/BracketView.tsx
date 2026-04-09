import React, { useEffect, useMemo, useState } from 'react';
import { BracketService } from '../services/bracket.service';
import {
  BracketMatch,
  BracketTeam,
  TeamRegistration,
  TournamentStats,
  User,
} from '../types/models';
import { Loading } from './Loading';
import toast from 'react-hot-toast';
import { BracketConnector } from './BracketConnector';
import { BracketConnectorIntegrationTest } from './BracketConnector.integration';
import firestoreService from '../services/firestore.service';
import authService from '../services/auth.service';

interface BracketViewProps {
  tournamentId: string;
  isAdmin?: boolean;
}

interface TeamPlayerView {
  name: string;
  phone?: string;
  userId?: string;
  image?: string;
}

interface SelectedTeamDetails {
  team: BracketTeam;
  registration?: TeamRegistration;
  players: TeamPlayerView[];
}

export const BracketView: React.FC<BracketViewProps> = ({
  tournamentId,
  isAdmin = false,
}) => {
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [bracketTeams, setBracketTeams] = useState<BracketTeam[]>([]);
  const [registrationsById, setRegistrationsById] = useState<
    Record<string, TeamRegistration>
  >({});
  const [selectedTeamDetails, setSelectedTeamDetails] =
    useState<SelectedTeamDetails | null>(null);
  const [resultForm, setResultForm] = useState({
    team1Score: 0,
    team2Score: 0,
  });
  const [team1Scorers, setTeam1Scorers] = useState<
    Array<{ playerId?: string; playerName: string; goals: number }>
  >([]);
  const [team2Scorers, setTeam2Scorers] = useState<
    Array<{ playerId?: string; playerName: string; goals: number }>
  >([]);
  const [scorerDraft, setScorerDraft] = useState({
    team1PlayerKey: '',
    team1Goals: 1,
    team2PlayerKey: '',
    team2Goals: 1,
  });
  const [bracketDims, setBracketDims] = useState({ width: 0, height: 0 });
  const bracketContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBracket();
  }, [tournamentId]);

  useEffect(() => {
    const updateDimensions = () => {
      if (bracketContainerRef.current) {
        const width = bracketContainerRef.current.scrollWidth;
        const height = bracketContainerRef.current.scrollHeight;
        console.log(`📐 Bracket dimensions: ${width}x${height}`);
        setBracketDims({
          width: width || 800, // Fallback to reasonable default
          height: height || 600,
        });
      }
    };

    // Check dimensions immediately
    updateDimensions();

    // Also check after a short delay to ensure DOM has settled
    setTimeout(updateDimensions, 100);

    const resizeObserver = new ResizeObserver(() => {
      console.log('↻ ResizeObserver triggered');
      updateDimensions();
    });

    if (bracketContainerRef.current) {
      resizeObserver.observe(bracketContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [bracket]); // Also trigger when bracket data changes

  // Run integration tests after bracket loads (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && bracket.length > 0 && bracketContainerRef.current) {
      console.log(`📊 Bracket loaded: ${bracket.length} matches, dims: ${bracketDims.width}x${bracketDims.height}`);
      setTimeout(() => {
        console.log('🧪 Running Bracket Connector tests...');
        const testResult = BracketConnectorIntegrationTest.runAll(bracketContainerRef.current!, bracket);
        console.log('Test result:', testResult);
      }, 500);
    }
  }, [bracket, bracketDims]);

  const loadBracket = async () => {
    try {
      setLoading(true);
      const [bracketData, statsData, teamsData, registrationsData] = await Promise.all([
        BracketService.getBracket(tournamentId),
        BracketService.getTournamentStats(tournamentId),
        BracketService.getRegisteredTeams(tournamentId),
        firestoreService.getTeamRegistrations(tournamentId),
      ]);

      setBracket(bracketData);
      setStats(statsData);
      setBracketTeams(teamsData);
      setRegistrationsById(
        registrationsData.reduce((acc, registration) => {
          acc[registration.id] = registration;
          return acc;
        }, {} as Record<string, TeamRegistration>)
      );
    } catch (error) {
      console.error('Error loading bracket:', error);
      toast.error('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  // When a match is selected for result entry, prefill scores and any existing scorers
  useEffect(() => {
    if (!selectedMatch) {
      setResultForm({ team1Score: 0, team2Score: 0 });
      setTeam1Scorers([]);
      setTeam2Scorers([]);
      setScorerDraft({
        team1PlayerKey: '',
        team1Goals: 1,
        team2PlayerKey: '',
        team2Goals: 1,
      });
      return;
    }

    setResultForm({
      team1Score: selectedMatch.result?.team1Score ?? 0,
      team2Score: selectedMatch.result?.team2Score ?? 0,
    });

    setTeam1Scorers(
      selectedMatch.result?.team1Scorers?.map((entry) => ({
        playerId: entry.playerId,
        playerName: entry.playerName,
        goals: entry.goals,
      })) || []
    );

    setTeam2Scorers(
      selectedMatch.result?.team2Scorers?.map((entry) => ({
        playerId: entry.playerId,
        playerName: entry.playerName,
        goals: entry.goals,
      })) || []
    );

    setScorerDraft({
      team1PlayerKey: '',
      team1Goals: 1,
      team2PlayerKey: '',
      team2Goals: 1,
    });
  }, [selectedMatch]);

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;

    if (
      resultForm.team1Score === resultForm.team2Score &&
      resultForm.team1Score > 0
    ) {
      toast.error('Match cannot end in a draw');
      return;
    }

    const totalTeam1Goals = team1Scorers.reduce((sum, s) => sum + s.goals, 0);
    const totalTeam2Goals = team2Scorers.reduce((sum, s) => sum + s.goals, 0);

    if (team1Scorers.length > 0 && totalTeam1Goals !== resultForm.team1Score) {
      toast.error('Team 1 goal breakdown must equal the team score');
      return;
    }

    if (team2Scorers.length > 0 && totalTeam2Goals !== resultForm.team2Score) {
      toast.error('Team 2 goal breakdown must equal the team score');
      return;
    }

    try {
      await BracketService.updateMatchResult(
        selectedMatch.id,
        resultForm.team1Score,
        resultForm.team2Score,
        tournamentId,
        {
          team1Scorers,
          team2Scorers,
        }
      );

      toast.success('Match result updated!');
      setSelectedMatch(null);
      loadBracket(); // Reload bracket
    } catch (error) {
      console.error('Error updating match result:', error);
      toast.error('Failed to update match result');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  };

  const handleViewTeamDetails = async (teamId?: string) => {
    if (!teamId) return;

    const team = bracketTeams.find((entry) => entry.id === teamId);
    if (!team) {
      toast.error('Team details not available yet.');
      return;
    }

    const registration = registrationsById[team.registrationId];
    const playersBase: TeamPlayerView[] = registration?.playersInfo?.length
      ? registration.playersInfo.map((player) => ({
          name: player.name,
          phone: player.phone,
          userId: player.userId,
        }))
      : (registration?.players || []).map((playerName) => ({
          name: playerName,
        }));

    const uniqueUserIds = Array.from(
      new Set(playersBase.map((player) => player.userId).filter(Boolean) as string[])
    );

    const profileEntries = await Promise.all(
      uniqueUserIds.map(async (uid) => {
        try {
          const profile = await authService.getUserProfile(uid);
          return [uid, profile] as [string, User | null];
        } catch {
          return [uid, null] as [string, User | null];
        }
      })
    );

    const profileMap = profileEntries.reduce((acc, [uid, profile]) => {
      acc[uid] = profile;
      return acc;
    }, {} as Record<string, User | null>);

    const players = playersBase.map((player) => {
      const profile = player.userId ? profileMap[player.userId] : null;
      return {
        ...player,
        image: profile?.profileImage || profile?.photoURL,
      };
    });

    setSelectedTeamDetails({
      team,
      registration,
      players,
    });
  };

  const getTeamPlayers = (teamId?: string): TeamPlayerView[] => {
    if (!teamId) return [];
    const team = bracketTeams.find((entry) => entry.id === teamId);
    if (!team) return [];
    const registration = registrationsById[team.registrationId];
    if (!registration) return [];

    if (registration.playersInfo?.length) {
      return registration.playersInfo.map((player) => ({
        name: player.name,
        phone: player.phone,
        userId: player.userId,
      }));
    }

    return (registration.players || []).map((playerName) => ({
      name: playerName,
    }));
  };

  const officialUpdates = useMemo(() => {
    const hasRealName = (name?: string) => {
      const normalized = (name || '').trim().toLowerCase();
      return normalized.length > 0 && normalized !== 'tbd';
    };

    const sorted = [...bracket].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const nonSchedule: Array<{ id: string; label: string; text: string }> = [];
    const schedule: Array<{ id: string; label: string; text: string }> = [];

    sorted.forEach((match) => {
      const team1Known = hasRealName(match.team1Name);
      const team2Known = hasRealName(match.team2Name);
      const matchupText = team1Known && team2Known
        ? `${match.team1Name} vs ${match.team2Name}`
        : `Round ${match.round} fixture`;

      if (match.status === 'completed') {
        const score = match.result
          ? `${match.result.team1Score}-${match.result.team2Score}`
          : null;
        const loserName = match.winnerId === match.team1Id ? match.team2Name : match.team1Name;
        const winnerKnown = hasRealName(match.winnerName);
        const loserKnown = hasRealName(loserName);

        let resultText = winnerKnown && loserKnown
          ? `${match.winnerName} defeated ${loserName}${score ? ` (${score})` : ''}.`
          : `${matchupText} result recorded${score ? ` (${score})` : ''}.`;

        const team1ScorersText = match.result?.team1Scorers?.length
          ? match.result.team1Scorers
              .map((s) => `${s.playerName} x${s.goals}`)
              .join(', ')
          : '';
        const team2ScorersText = match.result?.team2Scorers?.length
          ? match.result.team2Scorers
              .map((s) => `${s.playerName} x${s.goals}`)
              .join(', ')
          : '';

        const combinedScorersText = [team1ScorersText, team2ScorersText]
          .filter(Boolean)
          .join(' | ');

        if (combinedScorersText) {
          resultText += ` Scorers: ${combinedScorersText}.`;
        }

        nonSchedule.push({
          id: `${match.id}-completed`,
          label: 'Result',
          text: resultText,
        });
        return;
      }

      if (match.status === 'live') {
        nonSchedule.push({
          id: `${match.id}-live`,
          label: 'Live',
          text: `${matchupText} is now live.`,
        });
        return;
      }

      if (match.status === 'bye') {
        const byeText = team1Known
          ? `${match.team1Name} advanced with a bye.`
          : `A team advanced with a bye in Round ${match.round}.`;
        nonSchedule.push({
          id: `${match.id}-bye`,
          label: 'Bye',
          text: byeText,
        });
        return;
      }

      schedule.push({
        id: `${match.id}-scheduled`,
        label: 'Schedule',
        text: `${matchupText} is scheduled.`,
      });
    });

    return [...nonSchedule, ...schedule.slice(0, 2)].slice(0, 6);
  }, [bracket]);

  if (loading) return <Loading />;

  const matchesByRound: { [key: number]: BracketMatch[] } = {};
  bracket.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#3b0b27] via-[#4a0f2f] to-[#220814] text-white shadow-xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Tournament Stats / Header */}
      {stats && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] opacity-70">
              Knockout Bracket
            </p>
            <h2 className="mt-1 text-2xl md:text-3xl font-extrabold">
              Road to Champion
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="opacity-70 text-xs uppercase">Total Teams</p>
              <p className="text-2xl font-bold">{stats.totalTeams}</p>
            </div>
            <div>
              <p className="opacity-70 text-xs uppercase">Completed</p>
              <p className="text-2xl font-bold">{stats.completedMatches}</p>
            </div>
            <div>
              <p className="opacity-70 text-xs uppercase">Remaining</p>
              <p className="text-2xl font-bold">{stats.remainingTeams}</p>
            </div>
            <div className="flex flex-col items-start md:items-center justify-center">
              <p className="opacity-70 text-xs uppercase">Champion</p>
              <p className="mt-1 inline-flex items-center justify-center px-4 py-1 rounded-full border border-yellow-400/60 bg-black/20 text-sm font-semibold">
                {stats.winnerId ? '🏆 Champion' : 'To be decided'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Visualization - horizontal columns like tournament wall */}
      <div
        className="mt-2 overflow-x-auto pb-4 relative"
        ref={bracketContainerRef}
      >
        <p className="mb-3 text-[11px] sm:text-xs text-white/70">
          Official bracket updates are shown below. Click any team name to view team and player details.
        </p>
        <BracketConnector
          containerWidth={bracketDims.width}
          containerHeight={bracketDims.height}
        />
        <div className="min-w-max grid grid-flow-col auto-cols-[220px] md:auto-cols-[260px] gap-6 md:gap-10 relative z-10">
          {rounds.map((round, roundIndex) => {
            const isLast = roundIndex === rounds.length - 1;
            const isSecondLast = roundIndex === rounds.length - 2;

            const roundLabel = isLast
              ? 'Final'
              : isSecondLast
              ? 'Semi Final'
              : `Round ${roundIndex + 1}`;

            return (
              <div
                key={round}
                className={`bracket-column flex flex-col gap-4 ${
                  isLast ? 'bracket-column-last' : ''
                }`}
              >
                <div className="text-center text-xs md:text-sm font-semibold uppercase tracking-wide opacity-80">
                  {roundLabel}
                </div>

                <div className="flex flex-col gap-4">
                  {(() => {
                    const matches = matchesByRound[round] || [];
                    const pairCount = Math.ceil(matches.length / 2);

                    return Array.from({ length: pairCount }).map((_, pairIndex) => {
                      const firstIndex = pairIndex * 2;
                      const secondIndex = firstIndex + 1;
                      const matchA = matches[firstIndex];
                      const matchB = matches[secondIndex];

                      if (!matchA && !matchB) return null;

                      const renderCard = (match: BracketMatch | undefined, index: number) => {
                        if (!match) return null;
                        return (
                          <div
                            key={match.id}
                            className={`bracket-card p-3 md:p-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm transition bracket-node-enter ${
                              selectedMatch?.id === match.id
                                ? 'border-yellow-400 bg-yellow-400/10 shadow-lg'
                                : 'hover:border-white/40 hover:bg-white/10'
                            } ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                            style={{ animationDelay: `${index * 80}ms` }}
                            onClick={() => {
                              if (isAdmin) {
                                setSelectedMatch(match);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* Team 1 */}
                              <div className="flex-1">
                                <button
                                  type="button"
                                  className="flex items-center gap-2 w-full text-left group"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleViewTeamDetails(match.team1Id);
                                  }}
                                  disabled={!match.team1Id}
                                >
                                  {match.team1Logo && (
                                    <img
                                      src={match.team1Logo}
                                      alt={match.team1Name}
                                      className="w-7 h-7 rounded-full border border-white/40"
                                    />
                                  )}
                                  <span className="text-xs md:text-sm font-semibold truncate group-hover:text-yellow-200 transition">
                                    {match.team1Name || ''}
                                  </span>
                                </button>
                              </div>

                              {/* Score / VS */}
                              {match.status === 'completed' ? (
                                <div className="px-2 md:px-3 text-center text-xs md:text-sm font-bold">
                                  {match.result?.team1Score} - {match.result?.team2Score}
                                </div>
                              ) : (
                                <div className="px-2 md:px-3 text-center text-[10px] md:text-xs uppercase tracking-wide text-white/60">
                                  {match.status === 'bye' ? 'Bye' : 'vs'}
                                </div>
                              )}

                              {/* Team 2 */}
                              <div className="flex-1 text-right">
                                <button
                                  type="button"
                                  className="flex items-center justify-end gap-2 w-full group"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleViewTeamDetails(match.team2Id);
                                  }}
                                  disabled={!match.team2Id}
                                >
                                  <span className="text-xs md:text-sm font-semibold truncate group-hover:text-yellow-200 transition">
                                    {match.team2Name || ''}
                                  </span>
                                  {match.team2Logo && (
                                    <img
                                      src={match.team2Logo}
                                      alt={match.team2Name}
                                      className="w-7 h-7 rounded-full border border-white/40"
                                    />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Winner Badge */}
                            {match.winnerId && (
                              <div className="mt-2 text-center text-[11px] md:text-xs font-semibold text-yellow-300">
                                ✓ {match.winnerName} wins
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div key={`pair-${round}-${pairIndex}`} className="bracket-pair flex flex-col gap-3">
                          {renderCard(matchA, firstIndex)}
                          {renderCard(matchB, secondIndex)}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/20 bg-black/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm sm:text-base font-semibold tracking-wide uppercase text-white/90">
            Official Updates
          </h3>
          <span className="text-[11px] text-white/65">Latest match updates</span>
        </div>

        {officialUpdates.length === 0 ? (
          <p className="text-sm text-white/70">No official updates yet.</p>
        ) : (
          <div className="space-y-2.5">
            {officialUpdates.map((update) => (
              <div
                key={update.id}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <span className="mt-0.5 inline-flex items-center justify-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-200">
                  {update.label}
                </span>
                <p className="text-sm text-white/85">{update.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">Team Details</p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {selectedTeamDetails.team.teamName}
              </h2>
              <p className="mt-1 text-xs text-blue-100/90">
                Captain: {selectedTeamDetails.team.captainName} • Members: {selectedTeamDetails.team.totalMembers}
              </p>
            </div>

            <div className="px-6 py-5 bg-slate-50 max-h-[70vh] overflow-y-auto">
              {selectedTeamDetails.team.teamLogo && (
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={selectedTeamDetails.team.teamLogo}
                    alt={selectedTeamDetails.team.teamName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Team Logo</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTeamDetails.team.teamName}</p>
                  </div>
                </div>
              )}

              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Players
              </h3>

              {selectedTeamDetails.players.length === 0 ? (
                <p className="text-sm text-slate-600">Player details are not available for this team yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTeamDetails.players.map((player, index) => (
                    <div
                      key={`${player.userId || player.name}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                    >
                      {player.image ? (
                        <img
                          src={player.image}
                          alt={player.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                          {getInitials(player.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{player.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {player.phone || 'Phone not provided'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-white">
              <button
                type="button"
                onClick={() => setSelectedTeamDetails(null)}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Entry Modal (Admin Only) */}
      {isAdmin && selectedMatch && selectedMatch.status === 'pending' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-100">Update score</p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">Enter Match Result</h2>
              <p className="mt-1 text-xs text-blue-100/80">
                {selectedMatch.team1Name} vs {selectedMatch.team2Name}
              </p>
            </div>

            <div className="px-6 py-5 bg-slate-50/80">
              <div className="mb-4 rounded-2xl bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <span>Team</span>
                  <span>Score</span>
                </div>

                <div className="mt-3 space-y-3">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 truncate font-semibold text-slate-900">
                      {selectedMatch.team1Name}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={resultForm.team1Score}
                      onChange={(e) =>
                        setResultForm((prev) => ({
                          ...prev,
                          team1Score: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-20 rounded-xl border border-slate-300 px-3 py-1.5 text-center text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 truncate font-semibold text-slate-900">
                      {selectedMatch.team2Name}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={resultForm.team2Score}
                      onChange={(e) =>
                        setResultForm((prev) => ({
                          ...prev,
                          team2Score: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-20 rounded-xl border border-slate-300 px-3 py-1.5 text-center text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              </div>

              {/* Goal Scorers (Football-style breakdown) */}
              <div className="mb-4 rounded-2xl bg-white/80 p-4 shadow-sm space-y-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Goal Scorers (optional)
                </p>

                {/* Team 1 scorers */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">
                    {selectedMatch.team1Name} scorers
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={scorerDraft.team1PlayerKey}
                      onChange={(e) =>
                        setScorerDraft((prev) => ({
                          ...prev,
                          team1PlayerKey: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select player</option>
                      {getTeamPlayers(selectedMatch.team1Id).map((player) => {
                        const key = player.userId || player.name;
                        return (
                          <option key={key} value={key}>
                            {player.name}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="number"
                      min="1"
                      className="w-16 rounded-xl border border-slate-300 px-2 py-1.5 text-center text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={scorerDraft.team1Goals}
                      onChange={(e) =>
                        setScorerDraft((prev) => ({
                          ...prev,
                          team1Goals: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700"
                      onClick={() => {
                        const players = getTeamPlayers(selectedMatch.team1Id);
                        const player = players.find((p) =>
                          (p.userId || p.name) === scorerDraft.team1PlayerKey
                        );
                        if (!player) return;
                        setTeam1Scorers((prev) => [
                          ...prev,
                          {
                            playerId: player.userId,
                            playerName: player.name,
                            goals: scorerDraft.team1Goals,
                          },
                        ]);
                        setScorerDraft((prev) => ({
                          ...prev,
                          team1PlayerKey: '',
                          team1Goals: 1,
                        }));
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {team1Scorers.length > 0 && (
                    <p className="text-[11px] text-slate-600">
                      {team1Scorers
                        .map((s) => `${s.playerName} x${s.goals}`)
                        .join(', ')}
                    </p>
                  )}
                </div>

                {/* Team 2 scorers */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">
                    {selectedMatch.team2Name} scorers
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={scorerDraft.team2PlayerKey}
                      onChange={(e) =>
                        setScorerDraft((prev) => ({
                          ...prev,
                          team2PlayerKey: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select player</option>
                      {getTeamPlayers(selectedMatch.team2Id).map((player) => {
                        const key = player.userId || player.name;
                        return (
                          <option key={key} value={key}>
                            {player.name}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      type="number"
                      min="1"
                      className="w-16 rounded-xl border border-slate-300 px-2 py-1.5 text-center text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={scorerDraft.team2Goals}
                      onChange={(e) =>
                        setScorerDraft((prev) => ({
                          ...prev,
                          team2Goals: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700"
                      onClick={() => {
                        const players = getTeamPlayers(selectedMatch.team2Id);
                        const player = players.find((p) =>
                          (p.userId || p.name) === scorerDraft.team2PlayerKey
                        );
                        if (!player) return;
                        setTeam2Scorers((prev) => [
                          ...prev,
                          {
                            playerId: player.userId,
                            playerName: player.name,
                            goals: scorerDraft.team2Goals,
                          },
                        ]);
                        setScorerDraft((prev) => ({
                          ...prev,
                          team2PlayerKey: '',
                          team2Goals: 1,
                        }));
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {team2Scorers.length > 0 && (
                    <p className="text-[11px] text-slate-600">
                      {team2Scorers
                        .map((s) => `${s.playerName} x${s.goals}`)
                        .join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mb-4">
                Winner will be advanced automatically in the bracket. Draws are not allowed.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitResult}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-300"
                >
                  Save Result
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
