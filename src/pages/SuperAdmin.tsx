import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../components';

export default function SuperAdmin() {
  const modules = [
    {
      id: 'admin-mgmt',
      title: 'Admin Management',
      description: 'Promote or revoke admin access',
      icon: '🛡️',
      path: '/super-admin/admin-management',
      color: 'from-blue-500/20 to-blue-600/10',
    },
    {
      id: 'stream-queue',
      title: 'Stream Queue',
      description: 'Approve match streams and issue keys',
      icon: '🔴',
      path: '/super-admin/stream-queue',
      color: 'from-red-500/20 to-red-600/10',
    },
    {
      id: 'sponsors',
      title: 'Sponsorship',
      description: 'Manage sponsor campaigns',
      icon: '🤝',
      path: '/super-admin/sponsors',
      color: 'from-amber-500/20 to-amber-600/10',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <div className="mb-2 text-[11px] uppercase tracking-widest font-semibold text-primary">
          Control Tower
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Super Admin Dashboard</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-gray-500">
          Manage admins, streamers, sponsors, and monitor tournament operations.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.id} to={module.path}>
            <Card
              className="border border-gray-100 dark:border-gray-700 !bg-white dark:!bg-gray-800 transition"
              hoverable
            >
              <CardHeader
                title={module.title}
                subtitle={module.description}
                icon={module.icon}
              />
              <CardBody>
                <div className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center group-hover:underline">
                  Click to manage <span className="ml-1">→</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <section className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Quick Stats</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">Admins</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">Pending Streams</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">Active Sponsors</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
            <div className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">Tournaments</div>
          </div>
        </div>
      </section>
    </div>
  );
}
