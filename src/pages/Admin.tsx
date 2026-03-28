import { Card, CardBody, CardHeader } from '../components';

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage platform operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Users" icon="👤" />
          <CardBody>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total users</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tournaments" icon="🏆" />
          <CardBody>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active tournaments</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Revenue" icon="💰" />
          <CardBody>
            <p className="text-2xl font-bold text-primary">₹0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total revenue</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
