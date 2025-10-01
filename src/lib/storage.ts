import { FoodItem, ConsumedItem, ShoppingListItem, UserPreferences } from './types';

const STORAGE_KEYS = {
  ITEMS: 'freshbite_items',
  CONSUMED: 'freshbite_consumed',
  SHOPPING: 'freshbite_shopping',
  PREFERENCES: 'freshbite_preferences',
} as const;

export const storage = {
  // Food Items
  getItems: (): FoodItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  },
  
  setItems: (items: FoodItem[]) => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  },
  
  addItem: (item: FoodItem) => {
    const items = storage.getItems();
    items.push(item);
    storage.setItems(items);
  },
  
  updateItem: (id: string, updates: Partial<FoodItem>) => {
    const items = storage.getItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      storage.setItems(items);
    }
  },
  
  deleteItem: (id: string) => {
    const items = storage.getItems().filter(item => item.id !== id);
    storage.setItems(items);
  },
  
  // Consumed Items
  getConsumedItems: (): ConsumedItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CONSUMED);
    return data ? JSON.parse(data) : [];
  },
  
  addConsumedItem: (item: ConsumedItem) => {
    const consumed = storage.getConsumedItems();
    consumed.push(item);
    localStorage.setItem(STORAGE_KEYS.CONSUMED, JSON.stringify(consumed));
  },
  
  // Shopping List
  getShoppingList: (): ShoppingListItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPPING);
    return data ? JSON.parse(data) : [];
  },
  
  setShoppingList: (items: ShoppingListItem[]) => {
    localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(items));
  },
  
  addToShoppingList: (item: ShoppingListItem) => {
    const list = storage.getShoppingList();
    list.push(item);
    storage.setShoppingList(list);
  },
  
  updateShoppingItem: (id: string, updates: Partial<ShoppingListItem>) => {
    const list = storage.getShoppingList();
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      storage.setShoppingList(list);
    }
  },
  
  deleteShoppingItem: (id: string) => {
    const list = storage.getShoppingList().filter(item => item.id !== id);
    storage.setShoppingList(list);
  },
  
  clearCompletedShoppingItems: () => {
    const list = storage.getShoppingList().filter(item => !item.isCompleted);
    storage.setShoppingList(list);
  },
  
  // User Preferences
  getPreferences: (): UserPreferences | null => {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : null;
  },
  
  setPreferences: (prefs: UserPreferences) => {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  },
};
