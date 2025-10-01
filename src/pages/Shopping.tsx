import { useEffect, useState } from 'react';
import { Plus, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryIcon } from '@/components/CategoryIcon';
import { storage } from '@/lib/storage';
import { ShoppingListItem } from '@/lib/types';
import { categories } from '@/lib/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Shopping() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(categories[0]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = () => {
    setItems(storage.getShoppingList());
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    const newItem: ShoppingListItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: '1',
      isCompleted: false,
      source: 'manual',
    };

    storage.addToShoppingList(newItem);
    setNewItemName('');
    loadItems();
    toast.success('Item added to shopping list');
  };

  const handleToggleComplete = (id: string, isCompleted: boolean) => {
    storage.updateShoppingItem(id, { isCompleted });
    loadItems();
  };

  const handleDelete = (id: string) => {
    storage.deleteShoppingItem(id);
    loadItems();
    toast.success('Item removed');
  };

  const handleClearCompleted = () => {
    if (confirm('Clear all completed items?')) {
      storage.clearCompletedShoppingItems();
      loadItems();
      toast.success('Completed items cleared');
    }
  };

  const handleShare = () => {
    const text = items
      .filter(item => !item.isCompleted)
      .map(item => `- ${item.name} (${item.quantity})`)
      .join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'Shopping List',
        text: `My Shopping List:\n\n${text}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Shopping list copied to clipboard');
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const pendingItems = items.filter(item => !item.isCompleted);
  const completedItems = items.filter(item => item.isCompleted);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-fresh text-primary-foreground px-4 py-4">
        <h1 className="text-xl font-bold">Shopping List</h1>
        <p className="text-sm opacity-90 mt-1">{pendingItems.length} items to buy</p>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Add Item Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <div className="flex gap-2">
              <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={cat} />
                        {cat}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share List
            </Button>
            {completedItems.length > 0 && (
              <Button variant="outline" className="flex-1" onClick={handleClearCompleted}>
                Clear Completed
              </Button>
            )}
          </div>
        )}

        {/* Shopping List */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>Your shopping list is empty</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pending Items by Category */}
            {Object.entries(groupedItems).map(([category, categoryItems]) => {
              const pendingInCategory = categoryItems.filter(item => !item.isCompleted);
              if (pendingInCategory.length === 0) return null;

              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CategoryIcon category={category} />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingInCategory.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Checkbox
                          checked={item.isCompleted}
                          onCheckedChange={(checked) =>
                            handleToggleComplete(item.id, !!checked)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{item.quantity}</span>
                            {item.source === 'auto' && (
                              <span className="text-primary">• Auto-added</span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-critical" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {/* Completed Items */}
            {completedItems.length > 0 && (
              <Card className="border-success">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-success">
                    Completed ({completedItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedItems.map(item => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg opacity-60',
                        'hover:bg-secondary transition-colors'
                      )}
                    >
                      <Checkbox
                        checked={item.isCompleted}
                        onCheckedChange={(checked) =>
                          handleToggleComplete(item.id, !!checked)
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate line-through">{item.name}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
