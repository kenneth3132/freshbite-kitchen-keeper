// Smart categorization and storage suggestion system

const categoryKeywords: Record<string, string[]> = {
  'Milk & Dairy': [
    'milk', 'doodh', 'cheese', 'yogurt', 'yoghurt', 'curd', 'dahi', 'butter', 
    'cream', 'paneer', 'ghee', 'lassi', 'kheer', 'condensed', 'mozzarella', 
    'cheddar', 'parmesan', 'cottage', 'whey'
  ],
  'Vegetables & Fruits': [
    'apple', 'seb', 'banana', 'kela', 'orange', 'mango', 'aam', 'grape', 'angur',
    'berry', 'tomato', 'tamatar', 'potato', 'aloo', 'onion', 'pyaz', 'carrot',
    'gajar', 'spinach', 'palak', 'lettuce', 'cabbage', 'patta', 'gobi', 'broccoli',
    'cucumber', 'kakdi', 'pumpkin', 'kaddu', 'bhindi', 'okra', 'capsicum', 'shimla',
    'lemon', 'nimbu', 'garlic', 'lehsun', 'ginger', 'adrak', 'peas', 'matar',
    'cauliflower', 'beans', 'melon', 'papaya', 'guava', 'amrud', 'pomegranate', 'anaar'
  ],
  'Grains & Cereals': [
    'rice', 'chawal', 'wheat', 'gehun', 'bread', 'pav', 'roti', 'chapati', 'pasta',
    'noodles', 'oats', 'cereal', 'flour', 'maida', 'atta', 'besan', 'poha', 'upma',
    'dalia', 'quinoa', 'barley', 'jau', 'ragi', 'semolina', 'suji', 'corn', 'makki'
  ],
  'Meat & Protein': [
    'chicken', 'murgi', 'mutton', 'gosht', 'fish', 'machli', 'egg', 'anda', 'beef',
    'pork', 'sausage', 'bacon', 'ham', 'tofu', 'salmon', 'tuna', 'prawn', 'jhinga',
    'turkey', 'lamb', 'keema', 'tikka', 'kebab', 'protein'
  ],
  'Beverages': [
    'juice', 'ras', 'soda', 'water', 'pani', 'tea', 'chai', 'coffee', 'cola', 'pepsi',
    'coke', 'sprite', 'fanta', 'lassi', 'milkshake', 'smoothie', 'beer', 'wine',
    'alcohol', 'whiskey', 'drink', 'beverage', 'shake'
  ],
  'Condiments & Sauces': [
    'sauce', 'ketchup', 'mayo', 'mayonnaise', 'mustard', 'rai', 'pickle', 'achar',
    'chutney', 'vinegar', 'sirka', 'masala', 'spice', 'mirch', 'garam', 'turmeric',
    'haldi', 'salt', 'namak', 'sugar', 'chini', 'honey', 'shahad', 'jam', 'jelly',
    'oil', 'tel', 'chilli', 'powder', 'paste', 'spread'
  ],
  'Snacks': [
    'chips', 'wafers', 'biscuit', 'cookie', 'chocolate', 'candy', 'toffee', 'namkeen',
    'mixture', 'bhujia', 'sev', 'popcorn', 'cake', 'pastry', 'muffin', 'samosa',
    'pakora', 'mathri', 'papad', 'crackers', 'nuts', 'badam', 'cashew', 'kaju'
  ]
};

const storageRules: Record<string, string> = {
  'Milk & Dairy': 'Fridge',
  'Vegetables & Fruits': 'Fridge',
  'Meat & Protein': 'Fridge',
  'Grains & Cereals': 'Pantry',
  'Condiments & Sauces': 'Pantry',
  'Snacks': 'Cupboard',
  'Beverages': 'Fridge',
  'Others': 'Pantry'
};

const cupboardExceptions = ['banana', 'kela', 'potato', 'aloo', 'onion', 'pyaz', 'tomato', 'tamatar', 'garlic', 'lehsun'];
const freezerKeywords = ['frozen', 'ice cream', 'ice', 'freeze'];

interface CategoryResult {
  category: string;
  confidence: 'high' | 'low';
  matchedKeyword?: string;
}

interface CustomMappings {
  [key: string]: string;
}

const CUSTOM_MAPPINGS_KEY = 'freshbite_custom_categories';

// Get custom mappings from localStorage
function getCustomMappings(): CustomMappings {
  try {
    const stored = localStorage.getItem(CUSTOM_MAPPINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save custom mapping
export function saveCustomMapping(productName: string, category: string) {
  const mappings = getCustomMappings();
  mappings[productName.toLowerCase().trim()] = category;
  localStorage.setItem(CUSTOM_MAPPINGS_KEY, JSON.stringify(mappings));
}

// Detect category from product name
export function detectCategory(productName: string): CategoryResult {
  if (!productName || productName.length < 2) {
    return { category: 'Others', confidence: 'low' };
  }

  const normalized = productName.toLowerCase().trim();
  
  // Check custom mappings first (learned preferences)
  const customMappings = getCustomMappings();
  if (customMappings[normalized]) {
    return { category: customMappings[normalized], confidence: 'high', matchedKeyword: 'learned' };
  }

  // Split into words for multi-word matching
  const words = normalized.split(/\s+/);
  const matches: { category: string; word: string; position: number }[] = [];

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (const keyword of keywords) {
        if (word.includes(keyword) || keyword.includes(word)) {
          matches.push({ category, word, position: i });
          break;
        }
      }
    }
  }

  // No matches found
  if (matches.length === 0) {
    return { category: 'Others', confidence: 'low' };
  }

  // Single match - high confidence
  if (matches.length === 1) {
    return { category: matches[0].category, confidence: 'high', matchedKeyword: matches[0].word };
  }

  // Multiple matches - prioritize first word's category
  matches.sort((a, b) => a.position - b.position);
  
  // Tie-breaker order
  const priorityOrder = [
    'Meat & Protein',
    'Milk & Dairy',
    'Vegetables & Fruits',
    'Grains & Cereals',
    'Beverages',
    'Condiments & Sauces',
    'Snacks',
    'Others'
  ];

  // If first word has a match, use it
  const firstWordMatch = matches.find(m => m.position === 0);
  if (firstWordMatch) {
    return { category: firstWordMatch.category, confidence: 'high', matchedKeyword: firstWordMatch.word };
  }

  // Use priority order
  for (const priority of priorityOrder) {
    const match = matches.find(m => m.category === priority);
    if (match) {
      return { category: match.category, confidence: 'high', matchedKeyword: match.word };
    }
  }

  return { category: matches[0].category, confidence: 'low', matchedKeyword: matches[0].word };
}

// Suggest storage location
export function suggestStorage(category: string, productName: string): { storage: string; reason: string } {
  const normalized = productName.toLowerCase();

  // Check for frozen items
  for (const keyword of freezerKeywords) {
    if (normalized.includes(keyword)) {
      return { storage: 'Freezer', reason: 'frozen item' };
    }
  }

  // Check for cupboard exceptions
  for (const exception of cupboardExceptions) {
    if (normalized.includes(exception)) {
      return { storage: 'Cupboard', reason: 'best stored at room temperature' };
    }
  }

  // Meat & Protein special case
  if (category === 'Meat & Protein') {
    // Check if it mentions frozen or large quantity
    if (normalized.includes('kg') || normalized.includes('kilogram')) {
      return { storage: 'Freezer', reason: 'large quantity, better frozen' };
    }
    return { storage: 'Fridge', reason: 'perishable protein' };
  }

  const defaultStorage = storageRules[category] || 'Pantry';
  
  const reasons: Record<string, string> = {
    'Fridge': category === 'Milk & Dairy' ? 'perishable dairy' : 
              category === 'Vegetables & Fruits' ? 'fresh produce' : 
              category === 'Beverages' ? 'best served cold' : 'perishable',
    'Freezer': 'long-term storage',
    'Pantry': 'dry storage item',
    'Cupboard': 'shelf-stable snack'
  };

  return { storage: defaultStorage, reason: reasons[defaultStorage] || 'recommended' };
}

// Get placeholder text based on category
export function getQuantityPlaceholder(category: string): string {
  const placeholders: Record<string, string> = {
    'Milk & Dairy': 'e.g., 1 liter, 2 bottles',
    'Vegetables & Fruits': 'e.g., 500g, 6 pieces',
    'Grains & Cereals': 'e.g., 1kg, 1 packet',
    'Meat & Protein': 'e.g., 250g, 4 pieces',
    'Beverages': 'e.g., 1 liter, 6 cans',
    'Condiments & Sauces': 'e.g., 200ml, 1 bottle',
    'Snacks': 'e.g., 150g, 1 pack',
    'Others': 'e.g., 500g, 2 units'
  };
  
  return placeholders[category] || placeholders['Others'];
}
