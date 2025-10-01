import { ExpiryStatus, FoodItem } from './types';

export function calculateDaysRemaining(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = calculateDaysRemaining(expiryDate);
  if (days <= 3) return 'critical';
  if (days <= 7) return 'warning';
  return 'safe';
}

export function getExpiryStatusColor(status: ExpiryStatus): string {
  switch (status) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'safe':
      return 'success';
  }
}

export function sortItemsByExpiry(items: FoodItem[]): FoodItem[] {
  return [...items].sort((a, b) => {
    const daysA = calculateDaysRemaining(a.expiryDate);
    const daysB = calculateDaysRemaining(b.expiryDate);
    return daysA - daysB;
  });
}

export function formatExpiryMessage(days: number): string {
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

// BMI, BMR, TDEE Calculators
export function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female'
): number {
  // Mifflin-St Jeor Equation
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

export function getActivityMultiplier(level: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return multipliers[level] || 1.2;
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  return bmr * getActivityMultiplier(activityLevel);
}

export function calculateMacros(
  calories: number,
  dietType: string,
  weight?: number
): { protein: number; carbs: number; fats: number } {
  const macroRatios: Record<string, { protein: number; carbs: number; fats: number }> = {
    balanced: { protein: 0.3, carbs: 0.4, fats: 0.3 },
    protein_rich: { protein: 0.4, carbs: 0.35, fats: 0.25 },
    bulking: { protein: 0.25, carbs: 0.5, fats: 0.25 },
    keto: { protein: 0.3, carbs: 0.05, fats: 0.65 },
    low_carb: { protein: 0.35, carbs: 0.2, fats: 0.45 },
    vegetarian: { protein: 0.25, carbs: 0.45, fats: 0.3 },
  };

  const ratios = macroRatios[dietType] || macroRatios.balanced;
  
  let protein = (calories * ratios.protein) / 4; // 4 cal per gram
  const carbs = (calories * ratios.carbs) / 4;
  const fats = (calories * ratios.fats) / 9; // 9 cal per gram

  // Ensure minimum protein for protein-rich diet
  if (dietType === 'protein_rich' && weight) {
    protein = Math.max(protein, weight); // 1g per kg minimum
  }

  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
}

export function adjustCaloriesForGoal(tdee: number, goal: string): number {
  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500); // 500 cal deficit
    case 'gain':
      return Math.round(tdee + 500); // 500 cal surplus
    default:
      return Math.round(tdee);
  }
}
