import React, { useEffect, useState } from 'react';
import { TournamentService } from '../services/tournament.service';
import { BracketService } from '../services/bracket.service';
import { Tournament } from '../types/models';
import { CreateTournamentForm } from '../components/CreateTournamentForm';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { useAuth } from '../hooks';
import toast from 'react-hot-toast';

export const TournamentManagement: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadTournaments();
    }
  }, [user]);

  const loadTournaments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await TournamentService.getAdminTournaments(user.uid);
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBracket = async (tournament: Tournament) => {
    if (tournament.totalTeams < 2) {
      toast.error('Need at least 2 teams to generate bracket');
      return;
    }

    try {
      const deadline = await TournamentService.getRegistrationDeadline(
        tournament.id
      );
      if (!deadline) {
        toast.error('No registration deadline found');
        return;
      }

      const result = await BracketService.generateBracket(
        tournament.id,
        (deadline as any).bracketFormat || 'single_elimination'
      );

      await TournamentService.updateTournamentStatus(tournament.id, 'active');

      toast.success(
        `Bracket generated! ${result.matchesCreated} matches created.`
      );
      loadTournaments();
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast.error('Failed to generate bracket');
    }
  };

  const handleUpdateStatus = async (
    tournamentId: string,
    status: 'draft' | 'active' | 'completed' | 'cancelled'
  ) => {
    try {
      await TournamentService.updateTournamentStatus(tournamentId, status);
      toast.success('Tournament status updated');
      loadTournaments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (authLoading || loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tournament Management</h1>
        <Button
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          {showCreateForm ? 'Back to tournaments' : '+ Create Tournament'}
        </Button>
      </div>

      {/* Either show create form or tournaments list */}
      {showCreateForm ? (
        <div className="mt-4">
          <CreateTournamentForm
            onSuccess={() => {
              loadTournaments();
              setShowCreateForm(false);
            }}
            onClose={() => setShowCreateForm(false)}
          />
        </div>
      ) : tournaments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">No tournaments yet.</p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="mt-4"
          >
            Create Your First Tournament
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{tournament.name}</h2>
                  <p className="text-gray-600">{tournament.description}</p>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sport</p>
                      <p className="font-semibold">{tournament.sport}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Teams Registered</p>
                      <p className="font-semibold">
                        {tournament.totalTeams} / {tournament.maxTeams}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Entry Fee</p>
                      <p className="font-semibold">
                        ₹{tournament.entryFee} INR
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p
                        className={`font-semibold ${
                          tournament.status === 'active'
                            ? 'text-green-600'
                            : tournament.status === 'completed'
                              ? 'text-blue-600'
                              : 'text-yellow-600'
                        }`}
                      >
                        {tournament.status.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      📍 Location:{' '}
                      <span className="font-semibold">{tournament.location}</span>
                    </p>
                    <p>
                      📅 Start:{' '}
                      <span className="font-semibold">
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tournament Image */}
                {tournament.image && (
                  <img
                    src={tournament.image}
                    alt={tournament.name}
                    className="w-24 h-24 rounded-lg object-cover ml-4"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {tournament.status === 'draft' && (
                  <>
                    <Button
                      onClick={() =>
                        handleGenerateBracket(tournament)
                      }
                      className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3"
                    >
                      Generate Bracket
                    </Button>
                    <Button
                      onClick={() =>
                        handleUpdateStatus(tournament.id, 'active')
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3"
                    >
                      Start Tournament
                    </Button>
                  </>
                )}

                {tournament.status === 'active' && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus(tournament.id, 'completed')
                    }
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm py-1 px-3"
                  >
                    Mark Complete
                  </Button>
                )}

                <a
                  href={`/admin/tournament/${tournament.id}`}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded inline-block"
                >
                  Manage
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentManagement;
