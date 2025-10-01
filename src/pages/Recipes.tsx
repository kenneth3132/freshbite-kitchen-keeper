import { useState, useEffect } from 'react';
import { Search, Clock, Flame, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { mockRecipes } from '@/lib/mockData';
import { storage } from '@/lib/storage';
import { Recipe, FoodItem } from '@/lib/types';
import { toast } from 'sonner';
import { getExpiryStatus } from '@/lib/utils-food';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(mockRecipes);
  const [searchQuery, setSearchQuery] = useState('');
  const [mealFilter, setMealFilter] = useState('expiring');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(2);
  const [inventoryItems, setInventoryItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    setInventoryItems(storage.getItems());
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, mealFilter, recipes]);

  const applyFilters = () => {
    let result = [...recipes];

    // Search
    if (searchQuery) {
      result = result.filter(recipe =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Meal type filter
    if (mealFilter !== 'all' && mealFilter !== 'expiring') {
      result = result.filter(recipe => recipe.mealType === mealFilter);
    }

    // Sort by expiring ingredients if "expiring" filter is active
    if (mealFilter === 'expiring') {
      result = result.map(recipe => {
        const expiringCount = recipe.ingredients.filter(ing => {
          const item = inventoryItems.find(i =>
            i.name.toLowerCase().includes(ing.name.toLowerCase())
          );
          return item && (getExpiryStatus(item.expiryDate) === 'critical' || 
                         getExpiryStatus(item.expiryDate) === 'warning');
        }).length;
        return { ...recipe, expiringCount };
      }).sort((a, b) => (b.expiringCount || 0) - (a.expiringCount || 0));
    }

    setFilteredRecipes(result);
  };

  const getRecipeEmoji = (mealType: string) => {
    const emojis: Record<string, string> = {
      breakfast: '🍳',
      lunch: '🍱',
      dinner: '🍽️',
      snack: '🍪',
    };
    return emojis[mealType] || '🍴';
  };

  const checkIngredientAvailability = (ingredientName: string) => {
    const item = inventoryItems.find(i =>
      i.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
    
    if (!item) return { available: false, status: 'missing' };
    
    const status = getExpiryStatus(item.expiryDate);
    return {
      available: true,
      status: status === 'critical' || status === 'warning' ? 'expiring' : 'available',
    };
  };

  const handleCookRecipe = () => {
    if (!selectedRecipe) return;

    // Deduct ingredients from inventory
    selectedRecipe.ingredients.forEach(ingredient => {
      const item = inventoryItems.find(i =>
        i.name.toLowerCase().includes(ingredient.name.toLowerCase())
      );
      
      if (item) {
        // Mark as consumed
        storage.addConsumedItem({
          id: Date.now().toString() + Math.random(),
          itemName: item.name,
          consumedDate: new Date().toISOString(),
          method: 'recipe',
          quantity: `${ingredient.quantity} ${ingredient.unit}`,
        });
        
        // Update inventory (simplified - just remove for now)
        storage.deleteItem(item.id);
      }
    });

    setInventoryItems(storage.getItems());
    toast.success('Recipe cooked! Ingredients deducted from inventory');
    setSelectedRecipe(null);
  };

  const handleAddMissingToShopping = () => {
    if (!selectedRecipe) return;

    let addedCount = 0;
    selectedRecipe.ingredients.forEach(ingredient => {
      const availability = checkIngredientAvailability(ingredient.name);
      if (!availability.available) {
        storage.addToShoppingList({
          id: Date.now().toString() + Math.random(),
          name: ingredient.name,
          category: 'Others',
          quantity: `${ingredient.quantity} ${ingredient.unit}`,
          isCompleted: false,
          source: 'manual',
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`${addedCount} items added to shopping list`);
    } else {
      toast.info('All ingredients are available!');
    }
  };

  const countInventoryMatches = (recipe: Recipe) => {
    return recipe.ingredients.filter(ing => 
      checkIngredientAvailability(ing.name).available
    ).length;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-3">Recipes</h1>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={mealFilter} onValueChange={setMealFilter}>
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="expiring" className="text-xs px-1">Use Expiring</TabsTrigger>
            <TabsTrigger value="breakfast" className="text-xs px-1">Breakfast</TabsTrigger>
            <TabsTrigger value="lunch" className="text-xs px-1">Lunch</TabsTrigger>
            <TabsTrigger value="dinner" className="text-xs px-1">Dinner</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-1">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Recipe Grid */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {filteredRecipes.map((recipe) => {
          const matchCount = countInventoryMatches(recipe);
          
          return (
            <Card
              key={recipe.id}
              className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedRecipe(recipe);
                setServings(recipe.servings);
              }}
            >
              <CardContent className="p-0">
                <div className="bg-gradient-fresh h-32 rounded-t-lg flex items-center justify-center text-5xl">
                  {getRecipeEmoji(recipe.mealType)}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                    {recipe.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{recipe.prepTime + recipe.cookTime}m</span>
                    <Flame className="h-3 w-3 ml-1" />
                    <span>{recipe.calories}</span>
                  </div>
                  {matchCount > 0 && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      Uses {matchCount} items
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecipe.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Recipe Image */}
                <div className="bg-gradient-fresh h-40 rounded-lg flex items-center justify-center text-6xl">
                  {getRecipeEmoji(selectedRecipe.mealType)}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{selectedRecipe.description}</p>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Prep: {selectedRecipe.prepTime}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Cook: {selectedRecipe.cookTime}m</span>
                  </div>
                </div>

                {/* Servings Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Servings:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setServings(Math.max(1, servings - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold">{servings}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setServings(Math.min(6, servings + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, idx) => {
                      const availability = checkIngredientAvailability(ingredient.name);
                      const multiplier = servings / selectedRecipe.servings;
                      const adjustedQty = (parseFloat(ingredient.quantity) * multiplier).toFixed(1);

                      return (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Checkbox
                            checked={availability.available}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <span className={availability.available ? '' : 'text-muted-foreground line-through'}>
                              {ingredient.name}
                            </span>
                            {' - '}
                            <span className="text-muted-foreground">
                              {adjustedQty} {ingredient.unit}
                            </span>
                            {availability.status === 'expiring' && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Use first!
                              </Badge>
                            )}
                            {availability.status === 'missing' && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Need to buy
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nutrition */}
                <div>
                  <h3 className="font-semibold mb-2">Nutrition (per serving)</h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Calories</p>
                      <p className="font-semibold">{Math.round(selectedRecipe.calories)}</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Protein</p>
                      <p className="font-semibold">{Math.round(selectedRecipe.protein)}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="font-semibold">{Math.round(selectedRecipe.carbs)}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Fats</p>
                      <p className="font-semibold">{Math.round(selectedRecipe.fats)}g</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    {selectedRecipe.instructions.map((instruction, idx) => (
                      <li key={idx} className="text-muted-foreground">{instruction}</li>
                    ))}
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button className="w-full" onClick={handleCookRecipe}>
                    Cook This Recipe
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddMissingToShopping}
                  >
                    Add Missing Items to Shopping List
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
