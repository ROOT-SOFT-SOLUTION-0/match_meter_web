import React, { useEffect } from 'react';
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
  const { isServiceWorkerReady } = usePWA();

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

      {/* Service Worker Ready Indicator */}
      {isServiceWorkerReady && (
        <div className="fixed bottom-4 left-4 text-xs bg-green-500 text-white px-3 py-2 rounded-full">
          ✓ App is ready offline
        </div>
      )}
    </Router>
  );
}

export default App;
