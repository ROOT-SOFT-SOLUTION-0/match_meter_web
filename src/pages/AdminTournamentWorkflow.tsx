import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TournamentService } from '../services/tournament.service';
import { BracketService } from '../services/bracket.service';
import { Tournament, BracketTeam, BracketMatch, TeamRegistration } from '../types/models';
import firestoreService from '../services/firestore.service';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import toast from 'react-hot-toast';

type WorkflowStep =
  | 'details'
  | 'registration'
  | 'bracket-generation'
  | 'review-fixtures'
  | 'publish'
  | 'active';

interface BracketPreview {
  round: number;
  matches: Array<{
    matchNum: number;
    team1?: TeamRegistration | BracketTeam;
    team2?: TeamRegistration | BracketTeam;
    isBye?: boolean;
  }>;
}

export const AdminTournamentWorkflow: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registeredTeams, setRegisteredTeams] = useState<TeamRegistration[]>([]);
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('details');
  const [loading, setLoading] = useState(true);

  // Bracket generation form
  const [seedingMode, setSeedingMode] = useState<'random' | 'ranking' | 'manual'>(
    'random'
  );
  const [bracketPreview, setBracketPreview] = useState<BracketPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = async (options?: { keepStep?: boolean }) => {
    try {
      setLoading(true);
      const [tourData, teamsData] = await Promise.all([
        TournamentService.getTournament(tournamentId!),
        firestoreService.getTeamRegistrations(tournamentId!),
      ]);

      setTournament(tourData);
      setRegisteredTeams(teamsData);

      // Determine current workflow step unless caller wants to keep it
      if (!options?.keepStep) {
        if (tourData?.status === 'active') {
          setCurrentStep('active');
          const bracketData = await BracketService.getBracket(tournamentId!);
          setBracket(bracketData);
        } else if (tourData?.status === 'draft') {
          setCurrentStep('registration');
        }
      } else if (options.keepStep && tourData?.status === 'active') {
        // Even when keeping step, ensure we move to active if tournament is live
        setCurrentStep('active');
        const bracketData = await BracketService.getBracket(tournamentId!);
        setBracket(bracketData);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegistration = async () => {
    // Only proceed if we have enough active (non-rejected) teams
    const activeTeams = registeredTeams.filter(t => t.status !== 'rejected');
    if (!tournament || activeTeams.length < 2) {
      toast.error('Need at least 2 teams to close registration');
      return;
    }

    try {
      setLoading(true);
      await TournamentService.updateTournamentStatus(tournament.id, 'draft');
      setCurrentStep('bracket-generation');
      toast.success('Registration closed and ready for bracket generation');
      // Refresh data but keep the user on the bracket-generation step
      loadTournamentData({ keepStep: true });
    } catch (error) {
      console.error('Error closing registration:', error);
      toast.error('Failed to close registration');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      setLoading(true);
      await firestoreService.updateTeamRegistration(tournamentId!, registrationId, {
        status: 'approved',
      });
      toast.success('Registration approved');
      await loadTournamentData();
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Failed to approve registration');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    try {
      setLoading(true);
      await firestoreService.updateTeamRegistration(tournamentId!, registrationId, {
        status: 'rejected',
      });
      toast.success('Registration rejected');
      await loadTournamentData();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Failed to reject registration');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaymentCompleted = async (registrationId: string) => {
    try {
      setLoading(true);
      await firestoreService.updateTeamRegistration(tournamentId!, registrationId, {
        paymentStatus: 'completed',
      });
      toast.success('Marked as paid');
      await loadTournamentData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const generateBracketPreview = () => {
    const eligibleTeams = registeredTeams.filter(t => t.status !== 'rejected');
    if (eligibleTeams.length === 0) return;

    const totalTeams = eligibleTeams.length;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
    const byesNeeded = nextPowerOfTwo - totalTeams;
    const firstRoundMatches = (nextPowerOfTwo - byesNeeded) / 2;

    // Seed teams based on seeding mode
    let seededTeams = [...eligibleTeams];
    if (seedingMode === 'random') {
      seededTeams = seededTeams.sort(() => Math.random() - 0.5);
    } else if (seedingMode === 'ranking') {
      seededTeams = seededTeams.sort((a, b) => (a.seed || 999) - (b.seed || 999));
    }
    // manual will be handled by drag-and-drop later

    const preview: BracketPreview[] = [];

    // First round with byes
    const firstRound: BracketPreview['matches'] = [];
    let teamIndex = 0;

    // Add byes to top seeds
    for (let i = 0; i < byesNeeded; i++) {
      firstRound.push({
        matchNum: i + 1,
        team1: seededTeams[teamIndex++],
        isBye: true,
      });
    }

    // Add regular matches
    for (let i = byesNeeded; i < firstRoundMatches + byesNeeded; i++) {
      firstRound.push({
        matchNum: i + 1,
        team1: seededTeams[teamIndex++],
        team2: seededTeams[teamIndex++],
      });
    }

    preview.push({
      round: 1,
      matches: firstRound,
    });

    // Generate subsequent rounds (simplified preview)
    let matchesInRound = firstRoundMatches;
    for (let round = 2; round <= Math.ceil(Math.log2(nextPowerOfTwo)); round++) {
      const roundMatches = Math.ceil(matchesInRound / 2);
      preview.push({
        round,
        matches: Array.from({ length: roundMatches }, (_, i) => ({
          matchNum: i + 1,
        })),
      });
      matchesInRound = roundMatches;
    }

    setBracketPreview(preview);
    setShowPreview(true);
  };

  const handleGenerateBracket = async () => {
    const eligibleTeams = registeredTeams.filter(t => t.status !== 'rejected');
    if (!tournament || eligibleTeams.length < 2) {
      toast.error('Need at least 2 teams to generate a bracket');
      return;
    }

    try {
      setLoading(true);

      // First register all approved teams in bracket_teams collection
      for (const team of eligibleTeams) {
        await BracketService.registerTeamForBracket(
          tournament.id,
          team.id,
          team.teamName,
          team.userId || '',
          team.captain,
          team.players,
          team.teamLogo
        );
      }

      // Generate bracket
      const result = await BracketService.generateBracket(
        tournament.id,
        'single_elimination'
      );

      // Fetch the generated bracket
      const generatedBracket = await BracketService.getBracket(tournament.id);
      setBracket(generatedBracket);

      setCurrentStep('review-fixtures');
      setShowPreview(false);
      toast.success(
        `Bracket generated with ${result.matchesCreated} matches!`
      );
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast.error('Failed to generate bracket');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishFixtures = async () => {
    if (!tournament) return;

    try {
      setLoading(true);
      await TournamentService.updateTournamentStatus(tournament.id, 'active');
      setCurrentStep('active');
      toast.success('Fixtures published! Tournament is now active.');
      loadTournamentData();
    } catch (error) {
      console.error('Error publishing fixtures:', error);
      toast.error('Failed to publish fixtures');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tournament) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{tournament?.name}</h1>
          <p className="text-gray-600 mt-2">
            {tournament?.sport} • {tournament?.location}
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/tournaments')}
          className="bg-gray-600 hover:bg-gray-700"
        >
          Back to Tournaments
        </Button>
      </div>

      {/* Workflow Steps Indicator */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {[
            { key: 'details', label: 'Tournament Details', step: 1 },
            { key: 'registration', label: 'Registrations', step: 2 },
            { key: 'bracket-generation', label: 'Generate Bracket', step: 3 },
            { key: 'review-fixtures', label: 'Review Fixtures', step: 4 },
            { key: 'publish', label: 'Publish', step: 5 },
            { key: 'active', label: 'Active', step: 6 },
          ].map((item, index, array) => (
            <div key={item.key} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === item.key
                    ? 'bg-blue-600 text-white'
                    : currentStep === array.find((a) => a.key === 'active')?.key
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                }`}
              >
                {item.step}
              </div>
              <div className="text-sm font-medium ml-2">{item.label}</div>
              {index < array.length - 1 && (
                <div className="flex-1 h-1 bg-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Registration Management */}
      {(currentStep === 'registration' || currentStep === 'bracket-generation') && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Team Registrations</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 text-sm font-semibold">
              <div>Team Name</div>
              <div>Captain</div>
              <div>Members</div>
              <div>Payment</div>
              <div>Status</div>
            </div>

            {registeredTeams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No teams registered yet
              </div>
            ) : (
              registeredTeams.map((team) => (
                <div
                  key={team.id}
                  className="grid grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg items-center"
                >
                  <div className="font-semibold">{team.teamName}</div>
                  <div>{team.captain}</div>
                  <div>{team.totalMembers} members</div>
                  <div className="flex items-center gap-2">
                    {team.paymentStatus === 'completed' ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        Paid
                      </span>
                    ) : (
                      <>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          Not paid
                        </span>
                        <button
                          onClick={() => handleMarkPaymentCompleted(team.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          Mark as paid
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    {team.status === 'approved' ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        ✓ Approved
                      </span>
                    ) : team.status === 'rejected' ? (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        ✕ Rejected
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApproveRegistration(team.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRegistration(team.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-gray-700">
                <strong>Total Registered (active):</strong>{' '}
                {registeredTeams.filter(t => t.status !== 'rejected').length} teams
              </p>
              <p className="text-sm text-gray-700">
                <strong>Max Capacity:</strong> {tournament?.maxTeams} teams
              </p>
            </div>
          </div>

          {currentStep === 'registration' && (
            <Button
              onClick={handleCloseRegistration}
              isLoading={loading}
              className="mt-6 w-full bg-green-600 hover:bg-green-700"
            >
              ✓ Close Registration & Proceed
            </Button>
          )}
        </Card>
      )}

      {/* Bracket Generation */}
      {currentStep === 'bracket-generation' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Generate Match Bracket</h2>

          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Approved Teams:</strong> {registeredTeams.filter(t => t.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Bracket Size:</strong> {registeredTeams.filter(t => t.status === 'approved').length > 0 ? Math.pow(
                  2,
                  Math.ceil(Math.log2(registeredTeams.filter(t => t.status === 'approved').length))
                ) : 0}{' '}
                (with{' '}
                {registeredTeams.filter(t => t.status === 'approved').length > 0 ? Math.pow(
                  2,
                  Math.ceil(Math.log2(registeredTeams.filter(t => t.status === 'approved').length))
                ) - registeredTeams.filter(t => t.status === 'approved').length : 0}{' '}
                byes)
              </p>
            </div>

            {/* Seeding Mode Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Seeding Mode
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: 'random' as const,
                    label: 'Random',
                    desc: 'Teams randomly distributed',
                  },
                  {
                    value: 'ranking' as const,
                    label: 'Ranking-based',
                    desc: 'Based on team rankings',
                  },
                  {
                    value: 'manual' as const,
                    label: 'Manual',
                    desc: 'You set the exact order',
                  },
                ].map((mode) => (
                  <label
                    key={mode.value}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="seeding"
                      value={mode.value}
                      checked={seedingMode === mode.value}
                      onChange={(e) =>
                        setSeedingMode(e.target.value as typeof seedingMode)
                      }
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold">{mode.label}</p>
                      <p className="text-sm text-gray-600">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <Button
              onClick={generateBracketPreview}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Preview Bracket
            </Button>

            {/* Bracket Preview Modal */}
            {showPreview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="max-w-4xl w-full max-h-96 overflow-y-auto p-6">
                  <h3 className="text-xl font-bold mb-4">Bracket Preview</h3>

                  <div className="space-y-4">
                    {bracketPreview.map((round) => (
                      <div key={round.round}>
                        <h4 className="font-semibold text-gray-700 mb-2">
                          {round.round === 1
                            ? 'First Round'
                            : `Round ${round.round}`}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {round.matches.map((match) => (
                            <div
                              key={`${round.round}-${match.matchNum}`}
                              className="p-2 bg-gray-50 rounded text-sm"
                            >
                              {match.isBye ? (
                                <p className="text-gray-500">BYE: {match.team1?.teamName}</p>
                              ) : match.team1 && match.team2 ? (
                                <p>
                                  {match.team1.teamName} vs {match.team2.teamName}
                                </p>
                              ) : (
                                <p className="text-gray-400">TBD</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={handleGenerateBracket}
                      isLoading={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Generate & Proceed
                    </Button>
                    <Button
                      onClick={() => setShowPreview(false)}
                      className="flex-1 bg-gray-400 hover:bg-gray-500"
                    >
                      Back
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Review Fixtures */}
      {currentStep === 'review-fixtures' && bracket.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Review Fixtures</h2>

          <div className="space-y-4">
            {Object.entries(
              bracket.reduce(
                (acc, match) => {
                  if (!acc[match.round]) acc[match.round] = [];
                  acc[match.round].push(match);
                  return acc;
                },
                {} as Record<number, BracketMatch[]>
              )
            )
              .sort(([aRound], [bRound]) => Number(aRound) - Number(bRound))
              .map(([round, matches]) => (
                <div key={round}>
                  <h3 className="font-bold text-gray-700 mb-2">
                    {round === '1'
                      ? 'First Round'
                      : Number(round) === Object.keys(bracket).length
                        ? 'Final'
                        : `Round ${round}`}
                  </h3>
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {match.team1Name || ''}
                            </p>
                          </div>
                          <div className="px-4 text-center font-bold">vs</div>
                          <div className="flex-1 text-right">
                            <p className="font-semibold">
                              {match.team2Name || ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handlePublishFixtures}
              isLoading={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              ✓ Publish Fixtures & Start Tournament
            </Button>
            <Button
              onClick={() => setCurrentStep('bracket-generation')}
              className="flex-1 bg-gray-400 hover:bg-gray-500"
            >
              Back
            </Button>
          </div>
        </Card>
      )}

      {/* Active Tournament */}
      {currentStep === 'active' && bracket.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">🏆 Tournament Active</h2>
          <p className="text-gray-600 mb-4">Manage matches and updates below</p>

          <div className="space-y-4">
            {Object.entries(
              bracket.reduce(
                (acc, match) => {
                  if (!acc[match.round]) acc[match.round] = [];
                  acc[match.round].push(match);
                  return acc;
                },
                {} as Record<number, BracketMatch[]>
              )
            )
              .sort(([aRound], [bRound]) => Number(aRound) - Number(bRound))
              .map(([round, matches]) => (
                <div key={round}>
                  <h3 className="font-bold text-gray-700 mb-2">Round {round}</h3>
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className={`p-3 rounded-lg border-2 ${
                          match.status === 'completed'
                            ? 'bg-green-50 border-green-300'
                            : 'bg-yellow-50 border-yellow-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {match.team1Name || 'TBD'}
                            </p>
                          </div>
                          {match.status === 'completed' ? (
                            <div className="px-4 text-center font-bold">
                              {match.result?.team1Score} -{' '}
                              {match.result?.team2Score}
                            </div>
                          ) : (
                            <div className="px-4 text-center">vs</div>
                          )}
                          <div className="flex-1 text-right">
                            <p className="font-semibold">
                              {match.team2Name || 'TBD'}
                            </p>
                          </div>
                        </div>
                        {match.status === 'completed' && (
                          <p className="text-center text-sm text-green-700 mt-2">
                            ✓ Completed - {match.winnerName} wins
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <a
            href={`/tournament/${tournament?.id}/bracket`}
            className="inline-block mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            View Full Bracket
          </a>
        </Card>
      )}
    </div>
  );
};

export default AdminTournamentWorkflow;
