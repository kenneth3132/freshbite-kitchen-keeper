const categoryEmojis: Record<string, string> = {
  'Milk & Dairy': '🥛',
  'Vegetables & Fruits': '🍎',
  'Grains & Cereals': '🌾',
  'Meat & Protein': '🍖',
  'Beverages': '☕',
  'Condiments & Sauces': '🍯',
  'Snacks': '🍪',
  'Others': '📦',
};

interface CategoryIconProps {
  category: string;
  className?: string;
}

export function CategoryIcon({ category, className = 'h-4 w-4' }: CategoryIconProps) {
  const emoji = categoryEmojis[category] || '📦';
  return <span className={className} role="img" aria-label={category}>{emoji}</span>;
}
