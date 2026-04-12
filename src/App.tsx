import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ProtectedRoute } from './components/layout';
import { ToastContainer } from './components';
import { usePWA } from './hooks';
import fcmService from './services/fcm.service';
import backgroundSyncService from './services/background-sync.service';

// Pages - Lazy load for better performance
const HomePage = React.lazy(() => import('./pages/Home'));
const LoginPage = React.lazy(() => import('./pages/Login'));
const SignupPage = React.lazy(() => import('./pages/Signup'));
const PlayerDashboardPage = React.lazy(() => import('./pages/PlayerDashboard'));
const FeedPage = React.lazy(() => import('./pages/Feed'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));
const TournamentsPage = React.lazy(() => import('./pages/Tournaments'));
const TournamentDetailPage = React.lazy(() => import('./pages/TournamentDetail'));
const TournamentBracketPage = React.lazy(() => import('./pages/TournamentBracket'));
const LiveMatchControlPage = React.lazy(() => import('./pages/LiveMatchControl'));
const MyTeamsPage = React.lazy(() => import('./pages/MyTeams'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const AdminPage = React.lazy(() => import('./pages/Admin'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdmin'));
const AdminManagementPage = React.lazy(() => import('./pages/AdminManagement'));
const StreamQueuePage = React.lazy(() => import('./pages/StreamQueue'));
const SponsorManagementPage = React.lazy(() => import('./pages/SponsorManagement'));
const RevenuePage = React.lazy(() => import('./pages/Revenue'));
const TournamentManagementPage = React.lazy(
  () => import('./pages/TournamentManagement')
);
const AdminTournamentWorkflowPage = React.lazy(
  () => import('./pages/AdminTournamentWorkflow')
);
const NotFoundPage = React.lazy(() => import('./pages/NotFound'));

function App() {
  const { isInstallable, isInstalled, isIOS, showManualInstall, install } = usePWA();
  const [installing, setInstalling] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const handleInstallClick = async () => {
    if (!isInstallable) {
      setShowInstallHelp(true);
      return;
    }

    try {
      setInstalling(true);
      await install();
    } finally {
      setInstalling(false);
    }
  };

  const shouldShowInstallCTA = !isInstalled && (isInstallable || showManualInstall);

  // Initialize services
  useEffect(() => {
    // Initialize FCM
    fcmService.initialize();
    const unsubscribeFCM = fcmService.onMessage((payload) => {
      console.log('FCM message received:', payload);
    });

    // Initialize background sync
    backgroundSyncService.initialize();

    // Cleanup
    return () => {
      if (unsubscribeFCM) {
        unsubscribeFCM();
      }
      backgroundSyncService.destroy();
    };
  }, []);

  return (
    <Router>
      <Layout>
        <React.Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/player"
              element={
                <ProtectedRoute>
                  <PlayerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <FeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute checkProfileCompletion={false}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/tournaments"
              element={
                <ProtectedRoute>
                  <TournamentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournaments/:id"
              element={
                <ProtectedRoute>
                  <TournamentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournament/:id/bracket"
              element={
                <ProtectedRoute>
                  <TournamentBracketPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tournament/:id/bracket/:matchId/live"
              element={
                <ProtectedRoute requiredRole="admin">
                  <LiveMatchControlPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-teams"
              element={
                <ProtectedRoute>
                  <MyTeamsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute checkProfileCompletion={false}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-tournament"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TournamentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tournaments"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TournamentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tournament/:tournamentId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTournamentWorkflowPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <SuperAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/admin-management"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <AdminManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/stream-queue"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <StreamQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/sponsors"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <SponsorManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/revenue"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <RevenuePage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
      </Layout>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* PWA Install Button */}
      {shouldShowInstallCTA && (
        <button
          onClick={handleInstallClick}
          disabled={installing && isInstallable}
          className="fixed right-4 bottom-20 md:bottom-4 z-50 inline-flex items-center justify-center rounded-full bg-primary-600 hover:bg-primary-500 disabled:opacity-70 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-semibold shadow-soft"
          aria-label="Install app"
          title="Install app"
        >
          {installing ? 'Installing...' : isInstallable ? 'Install App' : 'Add to Home Screen'}
        </button>
      )}

      {/* Manual install guide for mobile browsers without native prompt */}
      {showInstallHelp && shouldShowInstallCTA && (
        <div className="fixed inset-0 z-[60] bg-black/50 p-4 flex items-end sm:items-center sm:justify-center">
          <div className="w-full sm:max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary-900 p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Install MATCHMETER
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Follow these steps to add the app to your home screen.
            </p>

            <ol className="mt-3 list-decimal pl-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
              {isIOS ? (
                <>
                  <li>Tap the Share button in Safari.</li>
                  <li>Select Add to Home Screen.</li>
                  <li>Tap Add to finish installation.</li>
                </>
              ) : (
                <>
                  <li>Tap the browser menu (three dots).</li>
                  <li>Select Install app or Add to Home screen.</li>
                  <li>Confirm Install.</li>
                </>
              )}
            </ol>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200"
              >
                Close
              </button>
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Try Install
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
