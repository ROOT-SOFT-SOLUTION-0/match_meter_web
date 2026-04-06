export type LoanStatus = 'active' | 'overdue' | 'closed';

export interface Loan {
  id: string;
  customerName: string;
  loanAmount: number;
  currency: string;
  frequency: 'Daily EMI' | 'Weekly EMI' | 'Monthly EMI';
  emiAmount: number;
  paidAmount: number;
  balanceAmount: number;
  progress: number; // 0 - 100
  startedAt: string; // ISO date string
  status: LoanStatus;
}

export const mockLoans: Loan[] = [
  {
    id: 'LN-1001',
    customerName: 'prakash',
    loanAmount: 10000,
    currency: 'INR',
    frequency: 'Daily EMI',
    emiAmount: 110,
    paidAmount: 1000,
    balanceAmount: 9000,
    progress: 10,
    startedAt: '2026-03-01',
    status: 'active',
  },
  {
    id: 'LN-1002',
    customerName: 'Santhosh Sharuk',
    loanAmount: 10000,
    currency: 'INR',
    frequency: 'Weekly EMI',
    emiAmount: 1572,
    paidAmount: 1572,
    balanceAmount: 8428,
    progress: 15,
    startedAt: '2026-02-20',
    status: 'active',
  },
  {
    id: 'LN-1003',
    customerName: 'Karthick',
    loanAmount: 10000,
    currency: 'INR',
    frequency: 'Weekly EMI',
    emiAmount: 1643,
    paidAmount: 72,
    balanceAmount: 9928,
    progress: 5,
    startedAt: '2026-03-10',
    status: 'active',
  },
];
