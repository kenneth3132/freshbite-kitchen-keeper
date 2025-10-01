import { Milk, Apple, Wheat, Beef, Coffee, Droplet, Cookie, Package } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

const categoryIcons: Record<string, LucideIcon> = {
  'Milk & Dairy': Milk,
  'Vegetables & Fruits': Apple,
  'Grains & Cereals': Wheat,
  'Meat & Protein': Beef,
  'Beverages': Coffee,
  'Condiments & Sauces': Droplet,
  'Snacks': Cookie,
  'Others': Package,
};

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className = 'h-4 w-4' }: CategoryIconProps) {
  const Icon = categoryIcons[category] || Package;
  return <Icon className={className} />;
}
