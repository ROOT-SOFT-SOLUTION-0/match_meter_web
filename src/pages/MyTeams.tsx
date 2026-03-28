import { Card, CardBody, CardHeader } from '../components';

export default function MyTeams() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Teams</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your team registrations</p>
      </div>

      <Card>
        <CardHeader title="Team Registrations" icon="👥" />
        <CardBody>
          <p className="text-gray-600 dark:text-gray-400 text-center py-12">
            No team registrations yet. Start by exploring tournaments and registering your team!
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
