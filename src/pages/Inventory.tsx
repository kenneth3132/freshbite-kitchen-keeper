import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StorageIcon } from '@/components/StorageIcon';
import { storage } from '@/lib/storage';
import { FoodItem, ConsumedItem } from '@/lib/types';
import { calculateDaysRemaining, getExpiryStatus, sortItemsByExpiry } from '@/lib/utils-food';
import { categories, storageLocations } from '@/lib/mockData';
import { toast } from 'sonner';

export default function Inventory() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStorage, setFilterStorage] = useState('all');
  const [filterExpiry, setFilterExpiry] = useState('all');
  const [sortBy, setSortBy] = useState('expiry');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0],
    quantity: '',
    expiryDate: '',
    storage: storageLocations[0],
    notes: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, searchQuery, filterCategory, filterStorage, filterExpiry, sortBy]);

  const loadItems = () => {
    const loadedItems = storage.getItems();
    setItems(loadedItems);
  };

  const applyFilters = () => {
    let result = [...items];

    // Search
    if (searchQuery) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory);
    }

    // Storage filter
    if (filterStorage !== 'all') {
      result = result.filter(item => item.storage === filterStorage);
    }

    // Expiry filter
    if (filterExpiry !== 'all') {
      result = result.filter(item => {
        const status = getExpiryStatus(item.expiryDate);
        if (filterExpiry === 'expiring') {
          return status === 'critical' || status === 'warning';
        }
        return status === 'safe';
      });
    }

    // Sort
    if (sortBy === 'expiry') {
      result = sortItemsByExpiry(result);
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'category') {
      result.sort((a, b) => a.category.localeCompare(b.category));
    }

    setFilteredItems(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.quantity || !formData.expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingItem) {
      storage.updateItem(editingItem.id, {
        ...formData,
      });
      toast.success('Item updated successfully');
    } else {
      const newItem: FoodItem = {
        id: Date.now().toString(),
        ...formData,
        dateAdded: new Date().toISOString().split('T')[0],
      };
      storage.addItem(newItem);
      toast.success('Item added successfully');
    }

    loadItems();
    resetForm();
    setIsAddDialogOpen(false);
    setEditingItem(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories[0],
      quantity: '',
      expiryDate: '',
      storage: storageLocations[0],
      notes: '',
    });
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expiryDate: item.expiryDate,
      storage: item.storage,
      notes: item.notes || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (item: FoodItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      storage.deleteItem(item.id);
      loadItems();
      toast.success('Item deleted');
    }
  };

  const handleMarkConsumed = (item: FoodItem) => {
    const consumedItem: ConsumedItem = {
      id: Date.now().toString(),
      itemName: item.name,
      consumedDate: new Date().toISOString(),
      method: 'manual',
      quantity: item.quantity,
    };
    
    storage.addConsumedItem(consumedItem);
    storage.deleteItem(item.id);
    
    // Add to shopping list
    storage.addToShoppingList({
      id: Date.now().toString(),
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      isCompleted: false,
      source: 'auto',
    });
    
    loadItems();
    toast.success('Item marked as consumed and added to shopping list');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-3">Inventory</h1>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStorage} onValueChange={setFilterStorage}>
            <SelectTrigger>
              <SelectValue placeholder="Storage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Storage</SelectItem>
              {storageLocations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterExpiry} onValueChange={setFilterExpiry}>
            <SelectTrigger>
              <SelectValue placeholder="Expiry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="fresh">Fresh</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiry">By Expiry</SelectItem>
              <SelectItem value="date">By Date Added</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Items List */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No items found</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const days = calculateDaysRemaining(item.expiryDate);
            const status = getExpiryStatus(item.expiryDate);

            return (
              <Card key={item.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-md text-xs">
                          <CategoryIcon category={item.category} className="h-3 w-3" />
                          {item.category}
                        </span>
                        <ExpiryBadge days={days} status={status} />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <StorageIcon storage={item.storage} />
                        <span>{item.storage}</span>
                        <span className="mx-1">•</span>
                        <span>{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                      className="flex-1"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkConsumed(item)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Consumed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item)}
                      className="text-critical hover:text-critical"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Floating Add Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-colored z-40"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Whole Milk"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
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
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 1 liter, 500g"
                required
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="storage">Storage Location *</Label>
              <Select value={formData.storage} onValueChange={(value) => setFormData({ ...formData, storage: value })}>
                <SelectTrigger id="storage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {storageLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      <div className="flex items-center gap-2">
                        <StorageIcon storage={loc} />
                        {loc}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingItem ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
