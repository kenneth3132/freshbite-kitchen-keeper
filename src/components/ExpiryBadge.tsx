import { cn } from '@/lib/utils';
import { ExpiryStatus } from '@/lib/types';
import { formatExpiryMessage } from '@/lib/utils-food';

interface ExpiryBadgeProps {
  days: number;
  status: ExpiryStatus;
  className?: string;
}

export function ExpiryBadge({ days, status, className }: ExpiryBadgeProps) {
  const statusColors = {
    critical: 'bg-critical text-critical-foreground',
    warning: 'bg-warning text-warning-foreground',
    safe: 'bg-success text-success-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColors[status],
        className
      )}
    >
      {formatExpiryMessage(days)}
    </span>
  );
}
