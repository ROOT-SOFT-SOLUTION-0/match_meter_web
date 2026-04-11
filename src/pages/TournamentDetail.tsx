import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentStore } from '../store';
import { Card, CardHeader, CardBody, Button, Loading, Modal } from '../components';
import { RegisterTeamForm } from '../components/RegisterTeamForm';
import { useAuth } from '../hooks';
import firestoreService from '../services/firestore.service';
import { BracketService } from '../services/bracket.service';
import { MetaTags } from '../components/MetaTags';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedTournament, loading, loadTournamentById, loadMatches } = useTournamentStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { user } = useAuth();
  const [hasRegistration, setHasRegistration] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [entriesCount, setEntriesCount] = useState<number>(0);
  const [hasBracket, setHasBracket] = useState(false);

  useEffect(() => {
    if (id) {
      loadTournamentById(id);
      loadMatches(id);
    }
  }, [id, loadTournamentById, loadMatches]);

  useEffect(() => {
    const loadEntries = async () => {
      if (!id) return;
      const regs = await firestoreService.getTeamRegistrations(id);
      // Count only non-rejected registrations towards capacity/entries
      const activeRegs = regs.filter(reg => reg.status !== 'rejected');
      setEntriesCount(activeRegs.length);
    };

    loadEntries();
  }, [id]);

  useEffect(() => {
    const loadBracketStatus = async () => {
      if (!id) return;
      try {
        const bracketMatches = await BracketService.getBracket(id);
        setHasBracket(bracketMatches.length > 0);
      } catch {
        setHasBracket(false);
      }
    };

    loadBracketStatus();
  }, [id]);

  useEffect(() => {
    const checkUserRegistration = async () => {
      if (!id || !user) {
        setHasRegistration(false);
        setRegistrationStatus(null);
        return;
      }

      const reg = await firestoreService.getUserRegistrationForTournament(id, user.uid);
      if (reg) {
        setHasRegistration(true);
        setRegistrationStatus(reg.status);
      } else {
        setHasRegistration(false);
        setRegistrationStatus(null);
      }
    };

    checkUserRegistration();
  }, [id, user]);

  const metaConfig = useMemo(() => {
    if (!selectedTournament) return { title: 'Loading...' };
    const baseUrl = 'https://your-domain.com';
    const url = `${baseUrl}/tournaments/${selectedTournament.id}`;
    const title = `${selectedTournament.name} | MatchMeter`;
    const description =
      selectedTournament.description ||
      `Join ${selectedTournament.name}, a ${selectedTournament.sport} tournament in ${selectedTournament.location}.`;

    const image = selectedTournament.image || '/assets/icon/icon-512x512.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        image,
        type: 'event',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image,
      },
      canonicalUrl: url,
    } as const;
  }, [selectedTournament]);

  const eventJsonLd = useMemo(() => {
    if (!selectedTournament) return null;
    const startDateIso = new Date(selectedTournament.startDate).toISOString();
    const endDateIso = new Date(selectedTournament.endDate).toISOString();
    const baseUrl = 'https://your-domain.com';

    return {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: selectedTournament.name,
      description:
        selectedTournament.description ||
        `Sports tournament for ${selectedTournament.sport} in ${selectedTournament.location}.`,
      sport: selectedTournament.sport,
      startDate: startDateIso,
      endDate: endDateIso,
      eventStatus:
        selectedTournament.status === 'completed'
          ? 'https://schema.org/EventCompleted'
          : selectedTournament.status === 'active'
          ? 'https://schema.org/EventInProgress'
          : 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: selectedTournament.location,
      },
      organizer: {
        '@type': 'Organization',
        name: 'MatchMeter',
      },
      url: `${baseUrl}/tournaments/${selectedTournament.id}`,
      image: selectedTournament.image ? [selectedTournament.image] : undefined,
      offers:
        typeof selectedTournament.entryFee === 'number'
          ? {
              '@type': 'Offer',
              price: selectedTournament.entryFee,
              priceCurrency: selectedTournament.currency || 'INR',
              availability: 'https://schema.org/InStock',
            }
          : undefined,
    };
  }, [selectedTournament]);

  if (loading || !selectedTournament) {
    return <Loading fullscreen message="Loading tournament details..." />;
  }

  // Helper function for consistent date formatting
  const formatDate = (date: number | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isRegistrationOpen = selectedTournament.status === 'draft';
  const isTournamentFull =
    typeof selectedTournament.maxTeams === 'number' &&
    selectedTournament.maxTeams > 0 &&
    entriesCount >= selectedTournament.maxTeams;
  const dateRange = `${formatDate(selectedTournament.startDate)} 
  – ${formatDate(selectedTournament.endDate)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <MetaTags config={metaConfig} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <div className="mb-6 flex flex-col gap-4">
        <div className="min-w-0 w-full">
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

          {selectedTournament.image && (
            <div className="w-full h-48 md:h-72 lg:h-96 rounded-2xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800 shadow-sm relative">
              <img src={selectedTournament.image} alt={selectedTournament.name} className="w-full h-full object-cover" />
            </div>
          )}

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
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</dt>
                  <dd className="text-lg flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    {selectedTournament.location}
                    {selectedTournament.googleMapsUrl && (
                      <a
                        href={selectedTournament.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center text-sm"
                        aria-label="Open in Google Maps"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
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
              {(() => {
                const getStatusLabel = (status: string) => {
                  if (status === 'draft') return 'Registration is started';
                  if (status === 'active') return 'Ongoing';
                  if (status === 'completed') return 'Completed';
                  return status;
                };

                return (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  selectedTournament.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : selectedTournament.status === 'completed'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {getStatusLabel(selectedTournament.status)}
                </span>
              </div>

                );
              })()}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Dates</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {dateRange}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Entries</label>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  {entriesCount} / {selectedTournament.maxTeams}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Bracket</label>
                {hasBracket ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/tournament/${selectedTournament.id}/bracket`)}
                  >
                    View bracket & official updates
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bracket will appear after admin closes registration.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Prize Pool</label>
                <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">
                  {selectedTournament.prizePool
                    ? `₹${selectedTournament.prizePool.toLocaleString()}`
                    : 'To be announced'}
                </p>
              </div>

              {!hasRegistration && (
                <Button
                  className="w-full mt-2"
                  onClick={() => setShowRegisterModal(true)}
                  disabled={!isRegistrationOpen || isTournamentFull}
                  variant={isRegistrationOpen && !isTournamentFull ? 'primary' : 'secondary'}
                >
                  {!isRegistrationOpen
                    ? 'Registration closed'
                    : isTournamentFull
                    ? 'Registration full'
                    : 'Register your team'}
                </Button>
              )}

              {hasRegistration && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
                  <div className="font-semibold mb-0.5">You have already registered a team</div>
                  <div className="opacity-90">
                    Status: {registrationStatus === 'approved'
                      ? 'Approved'
                      : registrationStatus === 'pending'
                      ? 'Pending admin approval'
                      : registrationStatus || 'Unknown'}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Team"
        size="full"
      >
        <RegisterTeamForm
          tournament={selectedTournament}
          onSuccess={() => {
            setShowRegisterModal(false);
            loadTournamentById(selectedTournament.id);
            // Refresh entries count after a successful registration
            firestoreService
              .getTeamRegistrations(selectedTournament.id)
              .then(regs => {
                const activeRegs = regs.filter(reg => reg.status !== 'rejected');
                setEntriesCount(activeRegs.length);
              })
              .catch(() => {
                // Silent fail; counts will refresh on next page load
              });

            // Refresh current user's registration status
            if (user) {
              firestoreService
                .getUserRegistrationForTournament(selectedTournament.id, user.uid)
                .then(reg => {
                  if (reg) {
                    setHasRegistration(true);
                    setRegistrationStatus(reg.status);
                  } else {
                    setHasRegistration(false);
                    setRegistrationStatus(null);
                  }
                })
                .catch(() => {
                  // Ignore errors here; status will be correct on full reload
                });
            }
          }}
          onClose={() => setShowRegisterModal(false)}
        />
      </Modal>
    </div>
  );
}