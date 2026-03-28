import { useState } from 'react';
import { useAuth } from '../hooks';
import { Card, CardHeader, CardBody, Button } from '../components';
import { ConfirmModal } from '../components/Modal';
import { useUIStore } from '../store';

export default function Settings() {
  const { user, upgradeToAdmin, loading } = useAuth();
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) {
    return null;
  }

  const handleUpgrade = async () => {
    setConfirmOpen(true);
  };

  const isAlreadyAdmin = user.role === 'admin' || user.role === 'super_admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      <Card>
        <CardHeader title="Account Role" icon="⚙️" />
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current role</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
            {user.is_premium && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Premium
              </span>
            )}
          </div>

          {!isAlreadyAdmin ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4 text-sm text-blue-800 dark:text-blue-100">
                <p className="font-semibold mb-1">Upgrade to Admin</p>
                <p>
                  Pay <span className="font-bold">₹199</span> one time to unlock admin features:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Create and manage tournaments.</li>
                  <li>Control brackets, schedules, and results.</li>
                  <li>Access advanced management tools in the admin dashboard.</li>
                </ul>
              </div>

              <Button onClick={handleUpgrade} isLoading={loading} className="mt-1">
                Upgrade to Admin (₹199)
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              You already have admin access. You can create and manage tournaments from the Admin Dashboard and
              tournament management pages.
            </p>
          )}
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Upgrade to Admin"
        message="Pay ₹199 one time to unlock admin tools and create/manage tournaments. Do you want to continue?"
        isLoading={loading}
        onConfirm={async () => {
          try {
            await upgradeToAdmin();
            setConfirmOpen(false);
            showSuccess('You are now an admin! You can create and manage tournaments.');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Upgrade failed';
            showError(message);
          }
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
