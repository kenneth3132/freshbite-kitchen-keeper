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
import { mockRecipes } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { calculateBMI, calculateBMR, calculateTDEE, calculateMacros, adjustCaloriesForGoal } from '@/lib/utils-food';
import { UserPreferences } from '@/lib/types';
import { toast } from 'sonner';

export default function MealPlan() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dietType, setDietType] = useState('balanced');
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

  // Sample meal plan
  const mealPlan = {
    breakfast: mockRecipes.find(r => r.mealType === 'breakfast')!,
    lunch: mockRecipes.find(r => r.mealType === 'lunch')!,
    dinner: mockRecipes.find(r => r.mealType === 'dinner')!,
  };

  const totalDailyCalories = mealPlan.breakfast.calories + mealPlan.lunch.calories + mealPlan.dinner.calories;
  const totalProtein = mealPlan.breakfast.protein + mealPlan.lunch.protein + mealPlan.dinner.protein;
  const totalCarbs = mealPlan.breakfast.carbs + mealPlan.lunch.carbs + mealPlan.dinner.carbs;
  const totalFats = mealPlan.breakfast.fats + mealPlan.lunch.fats + mealPlan.dinner.fats;

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-fresh text-primary-foreground px-4 py-4">
        <h1 className="text-xl font-bold mb-3">Meal Plan</h1>

        {/* Diet Type Tabs */}
        <Tabs value={dietType} onValueChange={setDietType}>
          <TabsList className="w-full grid grid-cols-3 h-auto bg-white/20">
            <TabsTrigger value="balanced" className="text-xs px-1">Balanced</TabsTrigger>
            <TabsTrigger value="protein_rich" className="text-xs px-1">Protein</TabsTrigger>
            <TabsTrigger value="keto" className="text-xs px-1">Keto</TabsTrigger>
          </TabsList>
        </Tabs>
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

        {/* Meals */}
        {Object.entries(mealPlan).map(([mealType, recipe]) => (
          <Card key={mealType}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 capitalize">
                <span className="text-2xl">{getMealEmoji(mealType)}</span>
                {mealType}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <h3 className="font-semibold">{recipe.name}</h3>
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
        ))}

        {/* Daily Summary */}
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
