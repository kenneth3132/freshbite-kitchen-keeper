import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, AlertCircle, Clock, Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StorageIcon } from '@/components/StorageIcon';
import { storage } from '@/lib/storage';
import { mockFoodItems, mockRecipes } from '@/lib/mockData';
import { FoodItem } from '@/lib/types';
import { calculateDaysRemaining, getExpiryStatus, sortItemsByExpiry } from '@/lib/utils-food';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    // Initialize with mock data if empty
    let loadedItems = storage.getItems();
    if (loadedItems.length === 0) {
      storage.setItems(mockFoodItems);
      loadedItems = mockFoodItems;
    }
    setItems(loadedItems);

    // Set today's date
    const today = new Date();
    setTodayDate(today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const expiringIn3Days = items.filter(item => {
    const days = calculateDaysRemaining(item.expiryDate);
    return days >= 0 && days <= 3;
  }).length;

  const expiringIn7Days = items.filter(item => {
    const days = calculateDaysRemaining(item.expiryDate);
    return days > 3 && days <= 7;
  }).length;

  const consumedThisWeek = storage.getConsumedItems().filter(item => {
    const consumedDate = new Date(item.consumedDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return consumedDate >= weekAgo;
  }).length;

  const expiringItems = sortItemsByExpiry(items).filter(item => {
    const days = calculateDaysRemaining(item.expiryDate);
    return days >= 0 && days <= 7;
  }).slice(0, 5);

  const todayMeal = mockRecipes[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-fresh text-primary-foreground px-4 py-6">
        <h1 className="text-2xl font-bold">Welcome to Freshbite</h1>
        <p className="text-sm opacity-90 mt-1">{todayDate}</p>
      </header>

      {/* Statistics Cards */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <PackageIcon className="h-4 w-4" />
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{items.length}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-critical">{expiringIn3Days}</p>
              <p className="text-xs text-muted-foreground mt-1">0-3 days</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Warning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-warning">{expiringIn7Days}</p>
              <p className="text-xs text-muted-foreground mt-1">4-7 days</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Consumed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{consumedThisWeek}</p>
              <p className="text-xs text-muted-foreground mt-1">This week</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expiring Soon Section */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Expiring Soon</h2>
          <Link to="/inventory">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {expiringItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items expiring soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {expiringItems.map((item) => {
              const days = calculateDaysRemaining(item.expiryDate);
              const status = getExpiryStatus(item.expiryDate);
              const borderColor = status === 'critical' ? 'border-critical' : status === 'warning' ? 'border-warning' : 'border-success';

              return (
                <Card key={item.id} className={cn('shadow-md border-l-4', borderColor)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <CategoryIcon category={item.category} />
                          <span className="truncate">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <StorageIcon storage={item.storage} />
                          <span>{item.storage}</span>
                          <span className="mx-1">•</span>
                          <span>{item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <ExpiryBadge days={days} status={status} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <Link to="/inventory">
            <Button className="w-full h-12 text-base font-semibold shadow-colored">
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="outline" className="w-full h-12 text-base">
              View All Inventory
            </Button>
          </Link>
          <Link to="/recipes">
            <Button variant="outline" className="w-full h-12 text-base">
              Get Recipe Suggestions
            </Button>
          </Link>
        </div>
      </section>

      {/* Today's Meal Suggestion */}
      <section className="px-4 mt-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Today's Meal Suggestion</h2>
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="bg-gradient-fresh h-32 rounded-lg mb-3 flex items-center justify-center">
              <span className="text-4xl">🍳</span>
            </div>
            <h3 className="font-semibold text-base">{todayMeal.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{todayMeal.mealType}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span>{todayMeal.calories} cal</span>
              <span>•</span>
              <span>{todayMeal.prepTime + todayMeal.cookTime} min</span>
            </div>
            <Link to="/recipes">
              <Button className="w-full mt-3">View Details</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
