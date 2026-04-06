import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Button, Badge } from '../components';
import { mockLoans, Loan } from '../data/loans';

const statusToBadgeVariant = (status: Loan['status']) => {
  if (status === 'active') return 'success' as const;
  if (status === 'overdue') return 'danger' as const;
  return 'default' as const;
};

export default function Loans() {
  const [search, setSearch] = useState('');

  const filteredLoans = useMemo(
    () =>
      mockLoans.filter((loan) =>
        loan.customerName.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [search]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Loans
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track customer loans, EMIs, payments, and outstanding balances.
          </p>
        </div>
        <Button type="button" className="whitespace-nowrap">
          + Create Loan
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-900/40 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
        />
        <svg
          className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Loans list */}
      <div className="space-y-4">
        {filteredLoans.map((loan) => (
          <Link
            key={loan.id}
            to={`/super-admin/loans/${loan.id}`}
            state={{ loan }}
            className="block"
          >
            <Card
              hoverable
              className="cursor-pointer overflow-hidden border border-gray-100/80 dark:border-gray-800/80"
            >
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {loan.customerName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Started on{' '}
                      {new Date(loan.startedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge variant={statusToBadgeVariant(loan.status)}>
                    {loan.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                      Loan Amount
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      ₹{loan.loanAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                      {loan.frequency}
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      ₹{loan.emiAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                      Paid
                    </p>
                    <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{loan.paidAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                      Balance
                    </p>
                    <p className="mt-1 text-base font-semibold text-orange-600 dark:text-orange-400">
                      ₹{loan.balanceAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${Math.max(0, Math.min(loan.progress, 100))}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}

        {filteredLoans.length === 0 && (
          <Card>
            <CardBody className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No loans found for this search.
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
