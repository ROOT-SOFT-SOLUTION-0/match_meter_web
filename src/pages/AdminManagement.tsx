import { useEffect, useState } from 'react';
import { Card, CardBody, Button } from '../components';
import { useUIStore } from '../store';
import adminService, { User } from '../services/admin.service';

export default function AdminManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const showError = useUIStore((state) => state.showError);
  const showSuccess = useUIStore((state) => state.showSuccess);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load users';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'user' | 'admin' | 'super_admin') => {
    setUpdatingUserId(uid);
    try {
      await adminService.updateUserRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
      showSuccess(`User role updated to ${newRole}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update role';
      showError(errorMsg);
      await loadUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👥 Admin Management</h2>
        <p className="mt-1 text-sm text-gray-500">Manage user roles and permissions</p>
      </section>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading users...</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.uid} className="!p-4">
              <CardBody className="!text-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{user.displayName || 'No name'}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 mt-2">
                      Role: {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['user', 'admin', 'super_admin'] as const).map((role) => (
                      <Button
                        key={role}
                        size="sm"
                        variant={user.role === role ? 'primary' : 'outline'}
                        onClick={() => handleRoleChange(user.uid, role)}
                        disabled={updatingUserId === user.uid}
                        className={user.role === role ? '' : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}