import type { DepositStatus } from '@/types';

interface DepositBadgeProps {
  status: DepositStatus;
  amount?: number; // in cents
}

/**
 * Badge component to display deposit status on appointments
 */
export default function DepositBadge({ status, amount }: DepositBadgeProps) {
  const amountFormatted = amount ? `$${(amount / 100).toFixed(2)}` : '';

  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span>💳</span>
          <span>Deposit: {amountFormatted}</span>
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span>⏳</span>
          <span>Awaiting deposit</span>
        </span>
      );
    case 'REFUNDED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span>↩️</span>
          <span>Refunded: {amountFormatted}</span>
        </span>
      );
    case 'FORFEITED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span>❌</span>
          <span>Forfeited: {amountFormatted}</span>
        </span>
      );
    default:
      return null;
  }
}
