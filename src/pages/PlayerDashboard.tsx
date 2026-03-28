import { useEffect, useState } from 'react';
import { useAuth } from '../hooks';
import { Button, Card, CardBody, CardHeader, Loading } from '../components';
import firestoreService from '../services/firestore.service';
import { TeamRegistration, Tournament } from '../types/models';
import { Link } from 'react-router-dom';

interface PlayerParticipation {
  registration: TeamRegistration;
  tournament: Tournament | null;
  played: number;
  wins: number;
  losses: number;
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participations, setParticipations] = useState<PlayerParticipation[]>([]);
  const [recommended, setRecommended] = useState<Tournament[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const allTournaments = await firestoreService.getTournaments();

        const regs: PlayerParticipation[] = [];
        for (const t of allTournaments) {
          const [regsForT, matches] = await Promise.all([
            firestoreService.getTeamRegistrations(t.id),
            firestoreService.getMatches(t.id),
          ]);

          regsForT
            .filter((r) =>
              r.playersInfo?.some((p) => p.userId === user.uid)
            )
            .forEach((r) => {
              const teamMatches = matches.filter(
                (m) => m.team1Name === r.teamName || m.team2Name === r.teamName
              );

              const completed = teamMatches.filter(
                (m) => m.status === 'completed'
              );

              const wins = completed.filter((m) => {
                if (m.team1Name === r.teamName) {
                  return (m.team1Score || 0) > (m.team2Score || 0);
                }
                if (m.team2Name === r.teamName) {
                  return (m.team2Score || 0) > (m.team1Score || 0);
                }
                return false;
              }).length;

              const losses = completed.length - wins;

              regs.push({
                registration: r,
                tournament: t,
                played: completed.length,
                wins,
                losses,
              });
            });
        }

        setParticipations(regs);

        const recs = allTournaments.filter((t) => {
          const matchesLocation = user.location
            ? t.location?.toLowerCase().includes(user.location.toLowerCase())
            : true;
          const matchesInterest = user.sportsInterests?.length
            ? user.sportsInterests.includes(t.sport)
            : true;
          return t.status !== 'completed' && matchesLocation && matchesInterest;
        });

        setRecommended(recs.slice(0, 6));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (!user) {
    return <Loading fullscreen message="Loading profile..." />;
  }

  if (loading) {
    return <Loading fullscreen message="Loading your dashboard..." />;
  }

  const totalTournaments = participations.length;
  const activeTournaments = participations.filter(
    (p) => p.tournament && p.tournament.status !== 'completed'
  ).length;
  const completedTournaments = participations.filter(
    (p) => p.tournament && p.tournament.status === 'completed'
  ).length;
  const totalMatches = participations.reduce((sum, p) => sum + p.played, 0);
  const totalWins = participations.reduce((sum, p) => sum + p.wins, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {user.displayName || 'Player'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your tournaments, teams, and upcoming opportunities.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/60 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Tournaments joined
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTournaments}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Active / upcoming
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTournaments}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Completed
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTournaments}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Matches played
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMatches}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Wins recorded
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalWins}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Your tournaments" icon="🏅" />
            <CardBody className="space-y-3">
              {participations.length === 0 && (
                <p className="text-sm text-gray-500">
                  You have not joined any tournaments yet.
                </p>
              )}

              {participations.map(({ registration, tournament, played, wins }) => (
                <div
                  key={registration.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-secondary-900/70 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {tournament?.name || 'Tournament'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Team: {registration.teamName} • Status: {registration.status}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Matches: {played} • Wins: {wins}
                    </p>
                  </div>
                  {tournament && (
                    <Link to={`/tournaments/${tournament.id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Suggested tournaments" icon="🎯" />
            <CardBody className="space-y-3">
              {recommended.length === 0 && (
                <p className="text-sm text-gray-500">
                  No suggestions right now. Update your location and sports
                  interests in your profile to get better recommendations.
                </p>
              )}

              {recommended.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-secondary-900/60 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.sport} • {t.location}
                    </p>
                  </div>
                  <Link to={`/tournaments/${t.id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
