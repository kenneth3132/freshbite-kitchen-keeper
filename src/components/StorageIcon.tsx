import { Refrigerator, Snowflake, Archive, Box } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

const storageIcons: Record<string, LucideIcon> = {
  'Fridge': Refrigerator,
  'Freezer': Snowflake,
  'Pantry': Archive,
  'Cupboard': Box,
};

interface StorageIconProps {
  storage: string;
  className?: string;
}

export function StorageIcon({ storage, className = 'h-4 w-4' }: StorageIconProps) {
  const Icon = storageIcons[storage] || Box;
  return <Icon className={className} />;
}
