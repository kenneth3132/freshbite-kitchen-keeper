import { Link } from 'react-router-dom';
import { Plus, Archive, ChefHat } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function FloatingActionButtons() {
  const actions = [
    {
      to: '/inventory',
      icon: Plus,
      label: 'Add New Item',
      bgColor: 'bg-[#10b981] hover:bg-[#059669]',
      ariaLabel: 'Add New Item',
    },
    {
      to: '/inventory',
      icon: Archive,
      label: 'View All Inventory',
      bgColor: 'bg-[#3b82f6] hover:bg-[#2563eb]',
      ariaLabel: 'View All Inventory',
    },
    {
      to: '/recipes',
      icon: ChefHat,
      label: 'Get Recipe Suggestions',
      bgColor: 'bg-[#f59e0b] hover:bg-[#d97706]',
      ariaLabel: 'Get Recipe Suggestions',
    },
  ];

  return (
    <div
      className={cn(
        'fixed z-[1000]',
        'right-5 top-1/2 -translate-y-1/2',
        'flex flex-col gap-3',
        'max-md:flex-row max-md:bottom-20 max-md:right-5 max-md:top-auto max-md:translate-y-0'
      )}
    >
      {actions.map((action) => (
        <Tooltip key={action.label}>
          <TooltipTrigger asChild>
            <Link
              to={action.to}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                'shadow-[0_4px_6px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_8px_rgba(0,0,0,0.15)]',
                'transition-all duration-200 hover:scale-110',
                'text-white',
                action.bgColor
              )}
              aria-label={action.ariaLabel}
            >
              <action.icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-md:side-top">
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
