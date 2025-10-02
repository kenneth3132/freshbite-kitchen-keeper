import { useState, useEffect } from 'react';
import { User, Scale, Ruler, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { UserPreferences } from '@/lib/types';
import { toast } from 'sonner';

export default function Settings() {
  const [formData, setFormData] = useState<UserPreferences>({
    weight: 0,
    height: 0,
    age: 0,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    preferredDiet: 'balanced',
  });

  const [bmi, setBmi] = useState<number | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);

  useEffect(() => {
    const prefs = storage.getPreferences();
    if (prefs) {
      setFormData(prefs);
      calculateMetrics(prefs);
    }
  }, []);

  const calculateMetrics = (data: UserPreferences) => {
    if (data.weight > 0 && data.height > 0 && data.age > 0) {
      // BMI = weight(kg) / height(m)²
      const heightInMeters = data.height / 100;
      const calculatedBmi = data.weight / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi);

      // BMR (Mifflin-St Jeor)
      // Men: 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
      // Women: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
      let calculatedBmr: number;
      if (data.gender === 'male') {
        calculatedBmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
      } else {
        calculatedBmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;
      }
      setBmr(calculatedBmr);
    }
  };

  const getBmiCategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Normal', color: 'text-safe' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-warning' };
    return { label: 'Obese', color: 'text-critical' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.weight || !formData.height || !formData.age) {
      toast.error('Please fill in all required fields');
      return;
    }

    storage.setPreferences(formData);
    calculateMetrics(formData);
    toast.success('Profile saved successfully!');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile for personalized meal plans</p>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your data is stored locally on your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight" className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Weight (kg) *
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    min="1"
                    max="300"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    placeholder="e.g., 70"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="height" className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Height (cm) *
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min="50"
                    max="250"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    placeholder="e.g., 175"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Age *
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="10"
                    max="120"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    placeholder="e.g., 25"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Gender *
                  </Label>
                  <Select value={formData.gender} onValueChange={(value: 'male' | 'female') => setFormData({ ...formData, gender: value })}>
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
                <Label htmlFor="activityLevel">Activity Level</Label>
                <Select value={formData.activityLevel} onValueChange={(value: any) => setFormData({ ...formData, activityLevel: value })}>
                  <SelectTrigger id="activityLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very_active">Very Active (intense exercise daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="goal">Fitness Goal</Label>
                <Select value={formData.goal} onValueChange={(value: any) => setFormData({ ...formData, goal: value })}>
                  <SelectTrigger id="goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="gain">Gain Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferredDiet">Preferred Diet</Label>
                <Select value={formData.preferredDiet} onValueChange={(value: any) => setFormData({ ...formData, preferredDiet: value })}>
                  <SelectTrigger id="preferredDiet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced Diet</SelectItem>
                    <SelectItem value="protein_rich">Protein-Rich</SelectItem>
                    <SelectItem value="bulking">Bulking</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="low_carb">Low-Carb</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        {bmi && bmr && (
          <Card>
            <CardHeader>
              <CardTitle>Your Health Metrics</CardTitle>
              <CardDescription>Calculated based on your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Body Mass Index</p>
                  <p className="text-2xl font-bold">{bmi.toFixed(1)}</p>
                  <p className={`text-sm font-medium ${getBmiCategory(bmi).color}`}>
                    {getBmiCategory(bmi).label}
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Basal Metabolic Rate</p>
                  <p className="text-2xl font-bold">{Math.round(bmr)}</p>
                  <p className="text-sm text-muted-foreground">kcal/day</p>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">💡 Quick Tip</p>
                <p className="text-sm text-muted-foreground">
                  Your BMR is the number of calories your body burns at rest. Combined with your activity level,
                  we'll suggest personalized meal plans in the Meal Plan section.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
