import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BracketView } from '../components/BracketView';
import { Button } from '../components';
import { useAuth } from '../hooks';

const TournamentBracket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-red-600 font-semibold">Invalid tournament id.</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Tournament Bracket
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View the knockout bracket and match progress.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="ml-4"
        >
          Back
        </Button>
      </div>

      <BracketView tournamentId={id} isAdmin={isAdmin} />
    </div>
  );
};

export default TournamentBracket;
