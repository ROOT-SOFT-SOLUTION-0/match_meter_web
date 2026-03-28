import React, { useEffect, useState } from 'react';
import { BracketService } from '../services/bracket.service';
import { BracketMatch, TournamentStats } from '../types/models';
import { Card } from './Card';
import { Loading } from './Loading';
import toast from 'react-hot-toast';

interface BracketViewProps {
  tournamentId: string;
  isAdmin?: boolean;
}

export const BracketView: React.FC<BracketViewProps> = ({
  tournamentId,
  isAdmin = false,
}) => {
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [resultForm, setResultForm] = useState({
    team1Score: 0,
    team2Score: 0,
  });

  useEffect(() => {
    loadBracket();
  }, [tournamentId]);

  const loadBracket = async () => {
    try {
      setLoading(true);
      const [bracketData, statsData] = await Promise.all([
        BracketService.getBracket(tournamentId),
        BracketService.getTournamentStats(tournamentId),
      ]);

      setBracket(bracketData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading bracket:', error);
      toast.error('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;

    if (
      resultForm.team1Score === resultForm.team2Score &&
      resultForm.team1Score > 0
    ) {
      toast.error('Match cannot end in a draw');
      return;
    }

    try {
      await BracketService.updateMatchResult(
        selectedMatch.id,
        resultForm.team1Score,
        resultForm.team2Score,
        tournamentId
      );

      toast.success('Match result updated!');
      setSelectedMatch(null);
      loadBracket(); // Reload bracket
    } catch (error) {
      console.error('Error updating match result:', error);
      toast.error('Failed to update match result');
    }
  };

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
    <div className="space-y-6">
      {/* Tournament Stats */}
      {stats && (
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">Total Teams</p>
              <p className="text-3xl font-bold">{stats.totalTeams}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Completed Matches</p>
              <p className="text-3xl font-bold">{stats.completedMatches}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Remaining Teams</p>
              <p className="text-3xl font-bold">{stats.remainingTeams}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Winner</p>
              <p className="text-2xl font-bold">
                {stats.winnerId ? '🏆' : 'TBD'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Bracket Visualization */}
      <div className="space-y-6">
        {rounds.map((round) => (
          <Card key={round} className="p-6">
            <h3 className="text-lg font-bold mb-4">
              {round === rounds[rounds.length - 1]
                ? 'Final'
                : round === rounds[rounds.length - 2]
                  ? 'Semi-Final'
                  : `Round ${round}`}
            </h3>

            <div className="space-y-3">
              {matchesByRound[round].map((match) => (
                <div
                  key={match.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedMatch?.id === match.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex items-center justify-between">
                    {/* Team 1 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {match.team1Logo && (
                          <img
                            src={match.team1Logo}
                            alt={match.team1Name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <span className="font-semibold">
                          {match.team1Name || 'TBD'}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    {match.status === 'completed' ? (
                      <div className="px-4 text-center font-bold">
                        {match.result?.team1Score} - {match.result?.team2Score}
                      </div>
                    ) : (
                      <div className="px-4 text-center text-gray-400">
                        {match.status === 'bye' ? 'BYE' : 'vs'}
                      </div>
                    )}

                    {/* Team 2 */}
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-semibold">
                          {match.team2Name || 'TBD'}
                        </span>
                        {match.team2Logo && (
                          <img
                            src={match.team2Logo}
                            alt={match.team2Name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Winner Badge */}
                  {match.winnerId && (
                    <div className="mt-2 text-center text-sm font-semibold text-green-600">
                      ✓ {match.winnerName} wins
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Result Entry Modal (Admin Only) */}
      {isAdmin && selectedMatch && selectedMatch.status === 'pending' && (
        <Card className="p-6 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Enter Match Result</h2>

            <div className="space-y-4">
              {/* Team 1 Score */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedMatch.team1Name} Score
                </label>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Team 2 Score */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {selectedMatch.team2Name} Score
                </label>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitResult}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Submit Result
                </button>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
