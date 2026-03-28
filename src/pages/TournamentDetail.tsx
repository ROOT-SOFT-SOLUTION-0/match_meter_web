import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store';
import { Card, CardHeader, CardBody, Button, Loading, Modal } from '../components';
import { RegisterTeamForm } from '../components/RegisterTeamForm';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTournament, loading, loadTournamentById, loadMatches } = useTournamentStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadTournamentById(id);
      loadMatches(id);
    }
  }, [id, loadTournamentById, loadMatches]);

  if (loading || !selectedTournament) {
    return <Loading fullscreen message="Loading tournament details..." />;
  }

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isRegistrationOpen = selectedTournament.status === 'draft';
  const dateRange = `${formatDate(selectedTournament.startDate)} 
  – ${formatDate(selectedTournament.endDate)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <button
            onClick={() => navigate('/tournaments')}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            aria-label="Back to tournaments list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to tournaments
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight truncate">
            {selectedTournament.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
              {selectedTournament.sport}
            </span>
            <span className="text-gray-400">•</span>
            <span>{dateRange}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <Card className="p-6">
            <CardHeader
              title="Tournament details"
              icon="🏆"
              className="pb-4 border-b border-gray-100 dark:border-gray-700 mb-6"
            />
            <CardBody className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Overview</h3>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedTournament.description || 'No description provided.'}
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Format</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTournament.rules || 'Standard'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Start date</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(selectedTournament.startDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">End date</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(selectedTournament.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Maximum teams</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTournament.maxTeams}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <Card className="p-6">
            <CardHeader
              title="Quick info"
              icon="ℹ️"
              className="pb-4 border-b border-gray-100 dark:border-gray-700 mb-6"
            />
            <CardBody className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  selectedTournament.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : selectedTournament.status === 'completed'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {selectedTournament.status.charAt(0).toUpperCase() + selectedTournament.status.slice(1)} {/* Capitalize status */}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Dates</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {dateRange}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Entries</label>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {selectedTournament.maxTeams}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Prize Pool</label>
                <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">
                  {selectedTournament.prizePool
                    ? `₹${selectedTournament.prizePool.toLocaleString()}`
                    : 'To be announced'}
                </p>
              </div>

              <Button
                className="w-full mt-2"
                onClick={() => setShowRegisterModal(true)}
                disabled={!isRegistrationOpen}
                variant={isRegistrationOpen ? 'primary' : 'secondary'}
              >
                {isRegistrationOpen ? 'Register your team' : 'Registration closed'}
              </Button>
            </CardBody>
          </Card>

          <Card className="p-6">
            <CardHeader
              title="Registration Fee"
              icon="💳"
              className="pb-4 border-b border-gray-100 dark:border-gray-700 mb-6"
            />
            <CardBody className="flex flex-col items-center text-center gap-4">
              <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-400 leading-none">
                ₹{selectedTournament.entryFee?.toLocaleString() || '0'}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Secure payment for tournament entry
              </p>

              {isRegistrationOpen && (
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => {/* Handle payment logic */}}
                >
                  Pay Now
                </Button>
              )}
              {!isRegistrationOpen && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  Payment option will be available when registration opens.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Team"
        size="lg"
      >
        <RegisterTeamForm
          tournament={selectedTournament}
          onSuccess={() => {
            setShowRegisterModal(false);
            loadTournamentById(selectedTournament.id);
          }}
          onClose={() => setShowRegisterModal(false)}
        />
      </Modal>
    </div>
  );
}