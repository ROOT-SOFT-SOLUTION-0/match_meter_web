import { useEffect, useState } from 'react';
import { useTournamentStore } from '../store';
import { useAuth } from '../hooks';
import { Card, CardHeader, CardBody, Loading, Button } from '../components';
import { Link } from 'react-router-dom';
import { MetaTags } from '../components/MetaTags';
import { getRouteMeta } from '../seo/routeMeta';

export default function Tournaments() {
  const { user } = useAuth();
  const {
    tournaments,
    loading,
    error,
    loadTournaments,
    currentPage,
  } = useTournamentStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTournaments(1, 10);
  }, [loadTournaments]);

  if (loading) {
    return <Loading fullscreen message="Loading tournaments..." />;
  }

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <MetaTags config={getRouteMeta('/tournaments')} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tournaments</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover and join tournaments</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Link to="/admin/tournaments">
            <Button>Create Tournament</Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search tournaments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
        />
        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tournaments Grid */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => {
            const getStatusLabel = (status: string) => {
              if (status === 'draft') return 'Registration is started';
              if (status === 'active') return 'Ongoing';
              if (status === 'completed') return 'Completed';
              return status;
            };

            return (
            <Link key={tournament.id} to={`/tournaments/${tournament.id}`}>
              <Card hoverable className="h-full cursor-pointer overflow-hidden">
                {tournament.image && (
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-800">
                    <img src={tournament.image} alt={tournament.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardHeader
                  title={tournament.name}
                  subtitle={tournament.sport}
                  icon="🏆"
                />
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        tournament.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        tournament.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {getStatusLabel(tournament.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {tournament.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teams</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {tournament.maxTeams}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Entry Fee</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{tournament.entryFee?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {searchQuery ? 'No tournaments found matching your search' : 'No tournaments available'}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Pagination Info */}
      <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
        Page {currentPage} of {Math.ceil((tournaments.length || 1) / 10)}
      </div>
    </div>
  );
}
