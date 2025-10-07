import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mockRecipes } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { calculateBMI, calculateBMR, calculateTDEE, calculateMacros, adjustCaloriesForGoal } from '@/lib/utils-food';
import { UserPreferences, Recipe } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const dietTypes = [
  { value: 'balanced', label: 'Balanced', tooltip: 'Well-rounded nutrition for general health' },
  { value: 'protein_rich', label: 'Protein-Rich', tooltip: '1g per kg body weight for muscle building' },
  { value: 'keto', label: 'Keto', tooltip: 'High-fat, low-carb for weight loss' },
  { value: 'low_carb', label: 'Low-Carb', tooltip: 'Reduced carbs for better blood sugar' },
  { value: 'vegetarian', label: 'Vegetarian', tooltip: 'Plant-based with eggs and dairy' },
  { value: 'vegan', label: 'Vegan', tooltip: 'Fully plant-based, no animal products' },
  { value: 'paleo', label: 'Paleo', tooltip: 'Whole foods, no grains or dairy' },
  { value: 'mediterranean', label: 'Mediterranean', tooltip: 'Olive oil, fish, vegetables' },
  { value: 'dash', label: 'DASH', tooltip: 'Low sodium, high fruits & vegetables' },
  { value: 'gluten_free', label: 'Gluten-Free', tooltip: 'No wheat, barley, or rye' },
  { value: 'whole30', label: 'Whole30', tooltip: '30-day reset, no sugar/grains/dairy' },
  { value: 'intermittent_fasting', label: 'IF', tooltip: 'Time-restricted eating (16/8)' },
  { value: 'bulking', label: 'Bulking', tooltip: 'Caloric surplus for muscle gain' },
];

const cuisineTypes = [
  'All Cuisines',
  'American',
  'Chinese',
  'Mexican',
  'Indian',
  'Italian',
  'Japanese',
  'Thai',
  'French',
  'Greek',
  'Korean',
  'Mediterranean',
  'Middle Eastern',
];

export default function MealPlan() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dietType, setDietType] = useState('balanced');
  const [cuisineType, setCuisineType] = useState('All Cuisines');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(storage.getPreferences());

  const [formData, setFormData] = useState({
    weight: preferences?.weight || 70,
    height: preferences?.height || 170,
    age: preferences?.age || 30,
    gender: preferences?.gender || 'male' as 'male' | 'female',
    activityLevel: preferences?.activityLevel || 'moderate',
    goal: preferences?.goal || 'maintain',
  });

  const [calculatedData, setCalculatedData] = useState<{
    bmi: number;
    bmr: number;
    tdee: number;
    targetCalories: number;
    macros: { protein: number; carbs: number; fats: number };
  } | null>(null);

  // Filter recipes by diet and cuisine
  const filterRecipes = (mealType: string): Recipe | undefined => {
    let filtered = mockRecipes.filter(r => r.mealType === mealType);
    
    // Filter by diet type
    filtered = filtered.filter(r => r.dietTypes.includes(dietType));
    
    // Filter by cuisine if not "All Cuisines"
    if (cuisineType !== 'All Cuisines') {
      const cuisineFiltered = filtered.filter(r => r.cuisine === cuisineType);
      if (cuisineFiltered.length > 0) {
        filtered = cuisineFiltered;
      }
    }
    
    return filtered[0];
  };

  const mealPlan = {
    breakfast: filterRecipes('breakfast'),
    lunch: filterRecipes('lunch'),
    dinner: filterRecipes('dinner'),
  };

  const totalDailyCalories = (mealPlan.breakfast?.calories || 0) + (mealPlan.lunch?.calories || 0) + (mealPlan.dinner?.calories || 0);
  const totalProtein = (mealPlan.breakfast?.protein || 0) + (mealPlan.lunch?.protein || 0) + (mealPlan.dinner?.protein || 0);
  const totalCarbs = (mealPlan.breakfast?.carbs || 0) + (mealPlan.lunch?.carbs || 0) + (mealPlan.dinner?.carbs || 0);
  const totalFats = (mealPlan.breakfast?.fats || 0) + (mealPlan.lunch?.fats || 0) + (mealPlan.dinner?.fats || 0);

  const handleCalculate = () => {
    const bmi = calculateBMI(formData.weight, formData.height);
    const bmr = calculateBMR(formData.weight, formData.height, formData.age, formData.gender);
    const tdee = calculateTDEE(bmr, formData.activityLevel);
    const targetCalories = adjustCaloriesForGoal(tdee, formData.goal);
    const macros = calculateMacros(targetCalories, dietType, formData.weight);

    setCalculatedData({
      bmi,
      bmr,
      tdee,
      targetCalories,
      macros,
    });

    // Save preferences
    const prefs: UserPreferences = {
      ...formData,
      preferredDiet: dietType as any,
      preferredCuisine: cuisineType,
    };
    storage.setPreferences(prefs);
    setPreferences(prefs);
    
    toast.success('Nutrition plan calculated!');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getMealEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      breakfast: '🍳',
      lunch: '🍱',
      dinner: '🍽️',
    };
    return emojis[type] || '🍴';
  };

  const hasRecipes = mealPlan.breakfast || mealPlan.lunch || mealPlan.dinner;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Diet Tabs */}
      <header className="bg-gradient-fresh text-primary-foreground px-4 py-4 sticky top-0 z-50">
        <h1 className="text-xl font-bold mb-3">Meal Plan</h1>

        {/* Diet Type Tabs - Scrollable */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {dietTypes.map((diet) => (
              <Tooltip key={diet.value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDietType(diet.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                      dietType === diet.value
                        ? 'bg-[#10b981] text-white shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    )}
                  >
                    {diet.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{diet.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Cuisine Selector */}
        <Select value={cuisineType} onValueChange={setCuisineType}>
          <SelectTrigger className="w-full bg-white/20 border-white/30 text-white">
            <SelectValue placeholder="Select Cuisine" />
          </SelectTrigger>
          <SelectContent>
            {cuisineTypes.map((cuisine) => (
              <SelectItem key={cuisine} value={cuisine}>
                {cuisine}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Date Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{formatDate(selectedDate)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No recipes message */}
        {!hasRecipes && (
          <Card className="border-warning">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No recipes found for this combination – try a different diet or cuisine.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Meals */}
        {Object.entries(mealPlan).map(([mealType, recipe]) => {
          if (!recipe) return null;
          
          return (
            <Card key={mealType}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 capitalize">
                  <span className="text-2xl">{getMealEmoji(mealType)}</span>
                  {mealType}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <h3 className="font-semibold">{recipe.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {recipe.cuisine} • {recipe.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{recipe.calories} cal</span>
                  <span>P: {recipe.protein}g</span>
                  <span>C: {recipe.carbs}g</span>
                  <span>F: {recipe.fats}g</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Replace
                  </Button>
                  <Button size="sm" className="flex-1">
                    View Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Daily Summary */}
        {hasRecipes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Nutrition Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Total Calories</span>
                  <span className="font-semibold">{totalDailyCalories} / {calculatedData?.targetCalories || 2000}</span>
                </div>
                <Progress 
                  value={(totalDailyCalories / (calculatedData?.targetCalories || 2000)) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Protein</span>
                  <span className="font-semibold">{totalProtein}g / {calculatedData?.macros.protein || 150}g</span>
                </div>
                <Progress 
                  value={(totalProtein / (calculatedData?.macros.protein || 150)) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Carbs</span>
                  <span className="font-semibold">{totalCarbs}g / {calculatedData?.macros.carbs || 200}g</span>
                </div>
                <Progress 
                  value={(totalCarbs / (calculatedData?.macros.carbs || 200)) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Fats</span>
                  <span className="font-semibold">{totalFats}g / {calculatedData?.macros.fats || 67}g</span>
                </div>
                <Progress 
                  value={(totalFats / (calculatedData?.macros.fats || 67)) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calculator Button */}
        <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Nutrition Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nutrition Calculator</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(v: any) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="activity">Activity Level</Label>
                <Select value={formData.activityLevel} onValueChange={(v: any) => setFormData({ ...formData, activityLevel: v })}>
                  <SelectTrigger id="activity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light Activity</SelectItem>
                    <SelectItem value="moderate">Moderate Activity</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goal">Goal</Label>
                <Select value={formData.goal} onValueChange={(v: any) => setFormData({ ...formData, goal: v })}>
                  <SelectTrigger id="goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="calcDiet">Diet Type</Label>
                <Select value={dietType} onValueChange={setDietType}>
                  <SelectTrigger id="calcDiet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dietTypes.map((diet) => (
                      <SelectItem key={diet.value} value={diet.value}>
                        {diet.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCalculate} className="w-full">
                Calculate
              </Button>

              {calculatedData && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">BMI</p>
                        <p className="text-xl font-bold">{calculatedData.bmi.toFixed(1)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">BMR</p>
                        <p className="text-xl font-bold">{Math.round(calculatedData.bmr)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">TDEE</p>
                        <p className="text-xl font-bold">{Math.round(calculatedData.tdee)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">Target Cal</p>
                        <p className="text-xl font-bold">{calculatedData.targetCalories}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Daily Macro Targets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Protein</span>
                        <span className="font-semibold">{calculatedData.macros.protein}g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Carbs</span>
                        <span className="font-semibold">{calculatedData.macros.carbs}g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fats</span>
                        <span className="font-semibold">{calculatedData.macros.fats}g</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
