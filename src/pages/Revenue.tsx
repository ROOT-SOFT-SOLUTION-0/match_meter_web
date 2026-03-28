import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CreditCard, LineChart, Wallet } from 'lucide-react';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHeadCell,
  TableHeader,
  TableRow,
} from '../components';

type PaymentStatus = 'succeeded' | 'pending' | 'failed';

interface Transaction {
  id: string;
  tournament: string;
  payer: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
  method: string;
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  succeeded: 'Succeeded',
  pending: 'Pending',
  failed: 'Failed',
};

const statusToBadgeVariant = (status: PaymentStatus) => {
  if (status === 'succeeded') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  return 'danger' as const;
};

const mockTransactions: Transaction[] = [
  {
    id: '#MM-2045',
    tournament: 'Summer Cup 2026',
    payer: 'Velocity FC',
    amount: 4999,
    currency: 'INR',
    status: 'succeeded',
    date: '2026-03-20T09:32:00Z',
    method: 'UPI',
  },
  {
    id: '#MM-2044',
    tournament: 'Street Cricket League',
    payer: 'Downtown Strikers',
    amount: 3499,
    currency: 'INR',
    status: 'pending',
    date: '2026-03-19T18:10:00Z',
    method: 'Card',
  },
  {
    id: '#MM-2043',
    tournament: 'City Basketball Open',
    payer: 'Skyline Hoopers',
    amount: 5999,
    currency: 'INR',
    status: 'succeeded',
    date: '2026-03-18T14:02:00Z',
    method: 'Card',
  },
  {
    id: '#MM-2042',
    tournament: 'Weekend 5v5 Arena',
    payer: 'North End United',
    amount: 2499,
    currency: 'INR',
    status: 'failed',
    date: '2026-03-17T11:45:00Z',
    method: 'UPI',
  },
];

const monthlyRevenue = [32, 40, 45, 38, 52, 60, 72, 68, 80, 76, 90, 96];

export default function Revenue() {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = mockTransactions.filter((tx) =>
    statusFilter === 'all' ? true : tx.status === statusFilter
  );

  const totalRevenue = mockTransactions
    .filter((tx) => tx.status === 'succeeded')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const mrr = 82000; // mock
  const conversionRate = 0.78; // mock

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Revenue & Payments
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor revenue across tournaments, track settlement status, and review recent transactions.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader
            title="Total revenue"
            subtitle="Last 30 days"
            icon={<Wallet className="h-4 w-4 text-emerald-500" />}
          />
          <CardBody>
            {loading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
            )}
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <ArrowUpRight className="h-3 w-3" />
              <span>+14.2% vs last month</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Monthly recurring"
            subtitle="Active subscriptions"
            icon={<CreditCard className="h-4 w-4 text-emerald-500" />}
          />
          <CardBody>
            {loading ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{mrr.toLocaleString('en-IN')}
              </p>
            )}
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <ArrowUpRight className="h-3 w-3" />
              <span>Stable growth</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Payment success rate"
            subtitle="Last 7 days"
            icon={<LineChart className="h-4 w-4 text-emerald-500" />}
          />
          <CardBody>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {(conversionRate * 100).toFixed(1)}%
              </p>
            )}
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
              <ArrowDownRight className="h-3 w-3" />
              <span>-1.3% vs previous</span>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Monthly revenue"
            subtitle="Mock data for visualization"
            icon={<LineChart className="h-4 w-4 text-emerald-500" />}
          />
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between text-xs text-gray-400">
                  <span>Jan</span>
                  <span>Dec</span>
                </div>
                <div className="relative h-40 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent">
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-1">
                    {monthlyRevenue.map((value, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-full bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-xs"
                        style={{ height: `${20 + value}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Settlement overview"
            subtitle="Breakdown by payment status"
            icon={<CreditCard className="h-4 w-4 text-emerald-500" />}
          />
          <CardBody className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Succeeded</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">72%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full w-[72%] rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Pending</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">18%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full w-[18%] rounded-full bg-amber-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Failed</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">10%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full w-[10%] rounded-full bg-rose-500" />
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-[0.12em] text-gray-500 dark:text-gray-400 uppercase">
              Recent transactions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Latest team payments and settlement status across tournaments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-gray-100/80 dark:bg-secondary-900/80 p-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              {(['all', 'succeeded', 'pending', 'failed'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-white dark:bg-secondary-800 text-gray-900 dark:text-gray-100 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  {status === 'all' ? 'All' : STATUS_LABEL[status]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title="No transactions for this filter"
            description="Try switching the status filter or adjust your date range to see more payments."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Payment</TableHeadCell>
                <TableHeadCell>Tournament</TableHeadCell>
                <TableHeadCell>Team</TableHeadCell>
                <TableHeadCell className="text-right">Amount</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Method</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{tx.id}</TableCell>
                  <TableCell>{tx.tournament}</TableCell>
                  <TableCell>{tx.payer}</TableCell>
                  <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                    ₹{tx.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusToBadgeVariant(tx.status)}>{STATUS_LABEL[tx.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{tx.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
