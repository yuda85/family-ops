import { CatalogItemSeed } from './shopping.models';

/**
 * Default catalog items for seeding a family's catalog
 * Prices are approximate Israeli supermarket prices in shekels (as of 2024)
 */
export const DEFAULT_CATALOG_ITEMS: CatalogItemSeed[] = [
  // ============================================
  // ירקות - VEGETABLES
  // ============================================
  { id: 'tomatoes', nameHe: 'עגבניות', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 8, keywords: ['עגבניות', 'עגבניה', 'tomato'] },
  { id: 'cucumbers', nameHe: 'מלפפונים', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 6, keywords: ['מלפפון', 'מלפפונים', 'cucumber'] },
  { id: 'onions', nameHe: 'בצל', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 5, keywords: ['בצל', 'onion'] },
  { id: 'potatoes', nameHe: 'תפוחי אדמה', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 2, estimatedPrice: 6, keywords: ['תפוח אדמה', 'תפוחי אדמה', 'potato'] },
  { id: 'carrots', nameHe: 'גזר', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 5, keywords: ['גזר', 'carrot'] },
  { id: 'peppers-red', nameHe: 'פלפל אדום', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 12, keywords: ['פלפל', 'אדום', 'pepper'] },
  { id: 'peppers-yellow', nameHe: 'פלפל צהוב', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 12, keywords: ['פלפל', 'צהוב', 'pepper'] },
  { id: 'peppers-green', nameHe: 'פלפל ירוק', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 8, keywords: ['פלפל', 'ירוק', 'pepper'] },
  { id: 'lettuce', nameHe: 'חסה', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['חסה', 'lettuce', 'סלט'] },
  { id: 'cabbage', nameHe: 'כרוב', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['כרוב', 'cabbage'] },
  { id: 'zucchini', nameHe: 'קישוא', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 8, keywords: ['קישוא', 'קישואים', 'zucchini'] },
  { id: 'eggplant', nameHe: 'חציל', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 10, keywords: ['חציל', 'חצילים', 'eggplant'] },
  { id: 'garlic', nameHe: 'שום', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 3, keywords: ['שום', 'garlic'] },
  { id: 'parsley', nameHe: 'פטרוזיליה', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 3, keywords: ['פטרוזיליה', 'parsley'] },
  { id: 'cilantro', nameHe: 'כוסברה', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 3, keywords: ['כוסברה', 'cilantro'] },
  { id: 'dill', nameHe: 'שמיר', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 3, keywords: ['שמיר', 'dill'] },
  { id: 'mint', nameHe: 'נענע', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 3, keywords: ['נענע', 'mint'] },
  { id: 'celery', nameHe: 'סלרי', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['סלרי', 'celery'] },
  { id: 'mushrooms', nameHe: 'פטריות', category: 'vegetables', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['פטריות', 'פטריה', 'mushroom'] },
  { id: 'corn', nameHe: 'תירס', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 2, estimatedPrice: 8, keywords: ['תירס', 'corn'] },
  { id: 'broccoli', nameHe: 'ברוקולי', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['ברוקולי', 'broccoli'] },
  { id: 'cauliflower', nameHe: 'כרובית', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['כרובית', 'cauliflower'] },
  { id: 'sweet-potato', nameHe: 'בטטה', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 8, keywords: ['בטטה', 'sweet potato'] },
  { id: 'pumpkin', nameHe: 'דלעת', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 6, keywords: ['דלעת', 'pumpkin'] },
  { id: 'radish', nameHe: 'צנון', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 4, keywords: ['צנון', 'radish'] },
  { id: 'beet', nameHe: 'סלק', category: 'vegetables', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 6, keywords: ['סלק', 'beet'] },
  { id: 'spinach', nameHe: 'תרד', category: 'vegetables', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['תרד', 'spinach'] },
  { id: 'green-onion', nameHe: 'בצל ירוק', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 3, keywords: ['בצל ירוק', 'green onion'] },
  { id: 'leek', nameHe: 'כרישה', category: 'vegetables', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['כרישה', 'leek'] },
  { id: 'ginger', nameHe: "ג'ינג'ר", category: 'vegetables', defaultUnit: 'gram', defaultQuantity: 100, estimatedPrice: 8, keywords: ["ג'ינג'ר", 'ginger'] },

  // ============================================
  // פירות - FRUITS
  // ============================================
  { id: 'apples', nameHe: 'תפוחים', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 10, keywords: ['תפוח', 'תפוחים', 'apple'] },
  { id: 'bananas', nameHe: 'בננות', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 8, keywords: ['בננה', 'בננות', 'banana'] },
  { id: 'oranges', nameHe: 'תפוזים', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 6, keywords: ['תפוז', 'תפוזים', 'orange'] },
  { id: 'clementines', nameHe: 'קלמנטינות', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 8, keywords: ['קלמנטינה', 'קלמנטינות'] },
  { id: 'grapes', nameHe: 'ענבים', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 15, keywords: ['ענבים', 'ענב', 'grapes'] },
  { id: 'watermelon', nameHe: 'אבטיח', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 3, estimatedPrice: 15, keywords: ['אבטיח', 'watermelon'] },
  { id: 'melon', nameHe: 'מלון', category: 'fruits', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['מלון', 'melon'] },
  { id: 'peaches', nameHe: 'אפרסקים', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 15, keywords: ['אפרסק', 'אפרסקים', 'peach'] },
  { id: 'nectarines', nameHe: 'נקטרינות', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 15, keywords: ['נקטרינה', 'נקטרינות', 'nectarine'] },
  { id: 'plums', nameHe: 'שזיפים', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 15, keywords: ['שזיף', 'שזיפים', 'plum'] },
  { id: 'pears', nameHe: 'אגסים', category: 'fruits', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 12, keywords: ['אגס', 'אגסים', 'pear'] },
  { id: 'strawberries', nameHe: 'תותים', category: 'fruits', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['תות', 'תותים', 'strawberry'] },
  { id: 'blueberries', nameHe: 'אוכמניות', category: 'fruits', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['אוכמניות', 'blueberry'] },
  { id: 'raspberries', nameHe: 'פטל', category: 'fruits', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['פטל', 'raspberry'] },
  { id: 'mango', nameHe: 'מנגו', category: 'fruits', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['מנגו', 'mango'] },
  { id: 'avocado', nameHe: 'אבוקדו', category: 'fruits', defaultUnit: 'units', defaultQuantity: 2, estimatedPrice: 10, keywords: ['אבוקדו', 'avocado'] },
  { id: 'lemon', nameHe: 'לימון', category: 'fruits', defaultUnit: 'units', defaultQuantity: 3, estimatedPrice: 5, keywords: ['לימון', 'lemon'] },
  { id: 'lime', nameHe: 'ליים', category: 'fruits', defaultUnit: 'units', defaultQuantity: 2, estimatedPrice: 4, keywords: ['ליים', 'lime'] },
  { id: 'pomegranate', nameHe: 'רימון', category: 'fruits', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['רימון', 'pomegranate'] },
  { id: 'kiwi', nameHe: 'קיווי', category: 'fruits', defaultUnit: 'units', defaultQuantity: 3, estimatedPrice: 8, keywords: ['קיווי', 'kiwi'] },
  { id: 'pineapple', nameHe: 'אננס', category: 'fruits', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['אננס', 'pineapple'] },
  { id: 'dates', nameHe: 'תמרים', category: 'fruits', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['תמר', 'תמרים', 'dates'] },
  { id: 'figs', nameHe: 'תאנים', category: 'fruits', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 18, keywords: ['תאנה', 'תאנים', 'figs'] },

  // ============================================
  // מוצרי חלב - DAIRY
  // ============================================
  { id: 'milk-3', nameHe: 'חלב 3%', category: 'dairy', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 7, keywords: ['חלב', 'milk'] },
  { id: 'milk-1', nameHe: 'חלב 1%', category: 'dairy', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 7, keywords: ['חלב', 'milk', 'דל שומן'] },
  { id: 'milk-bag', nameHe: 'חלב בשקית', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['חלב', 'שקית', 'milk'] },
  { id: 'cottage', nameHe: "קוטג'", category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ["קוטג'", 'cottage'] },
  { id: 'cottage-5', nameHe: "קוטג' 5%", category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ["קוטג'", 'cottage'] },
  { id: 'yogurt-plain', nameHe: 'יוגורט לבן', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 5, keywords: ['יוגורט', 'yogurt'] },
  { id: 'yogurt-fruit', nameHe: 'יוגורט פירות', category: 'dairy', defaultUnit: 'pack', defaultQuantity: 4, estimatedPrice: 12, keywords: ['יוגורט', 'yogurt', 'פירות'] },
  { id: 'leben', nameHe: 'לבן', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 5, keywords: ['לבן', 'leben'] },
  { id: 'sour-cream', nameHe: 'שמנת חמוצה', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['שמנת', 'חמוצה', 'sour cream'] },
  { id: 'sweet-cream', nameHe: 'שמנת מתוקה', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['שמנת', 'מתוקה', 'sweet cream'] },
  { id: 'butter', nameHe: 'חמאה', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['חמאה', 'butter'] },
  { id: 'margarine', nameHe: 'מרגרינה', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['מרגרינה', 'margarine'] },
  { id: 'yellow-cheese', nameHe: 'גבינה צהובה', category: 'dairy', defaultUnit: 'gram', defaultQuantity: 200, estimatedPrice: 15, keywords: ['גבינה', 'צהובה', 'cheese'] },
  { id: 'white-cheese-5', nameHe: 'גבינה לבנה 5%', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['גבינה', 'לבנה', 'cheese'] },
  { id: 'white-cheese-9', nameHe: 'גבינה לבנה 9%', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['גבינה', 'לבנה', 'cheese'] },
  { id: 'cream-cheese', nameHe: 'גבינת שמנת', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['גבינת שמנת', 'cream cheese'] },
  { id: 'mozzarella', nameHe: 'מוצרלה', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['מוצרלה', 'mozzarella'] },
  { id: 'parmesan', nameHe: 'פרמזן', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 18, keywords: ['פרמזן', 'parmesan'] },
  { id: 'feta', nameHe: 'פטה', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['פטה', 'feta', 'בולגרית'] },
  { id: 'tzfatit', nameHe: 'גבינה צפתית', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['צפתית', 'גבינה'] },
  { id: 'eggs-12', nameHe: 'ביצים L', category: 'dairy', defaultUnit: 'units', defaultQuantity: 12, estimatedPrice: 22, keywords: ['ביצים', 'ביצה', 'eggs'] },
  { id: 'eggs-30', nameHe: 'ביצים טריי 30', category: 'dairy', defaultUnit: 'units', defaultQuantity: 30, estimatedPrice: 45, keywords: ['ביצים', 'ביצה', 'eggs', 'טריי'] },
  { id: 'chocolate-milk', nameHe: 'שוקו', category: 'dairy', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['שוקו', 'chocolate milk'] },
  { id: 'pudding', nameHe: 'מעדן', category: 'dairy', defaultUnit: 'pack', defaultQuantity: 4, estimatedPrice: 12, keywords: ['מעדן', 'פודינג', 'pudding'] },

  // ============================================
  // בשר ודגים - MEAT & FISH
  // ============================================
  { id: 'chicken-breast', nameHe: 'חזה עוף', category: 'meat', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 40, keywords: ['חזה', 'עוף', 'chicken'] },
  { id: 'chicken-thighs', nameHe: 'ירכיים עוף', category: 'meat', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 30, keywords: ['ירכיים', 'עוף', 'chicken'] },
  { id: 'chicken-wings', nameHe: 'כנפיים', category: 'meat', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 25, keywords: ['כנפיים', 'עוף', 'wings'] },
  { id: 'whole-chicken', nameHe: 'עוף שלם', category: 'meat', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 40, keywords: ['עוף', 'שלם', 'chicken'] },
  { id: 'schnitzel', nameHe: 'שניצל עוף', category: 'meat', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 50, keywords: ['שניצל', 'עוף', 'schnitzel'] },
  { id: 'ground-beef', nameHe: 'בשר טחון', category: 'meat', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 50, keywords: ['בשר', 'טחון', 'ground beef'] },
  { id: 'beef-steak', nameHe: 'סטייק בקר', category: 'meat', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 100, keywords: ['סטייק', 'בקר', 'steak'] },
  { id: 'beef-roast', nameHe: 'צלי בקר', category: 'meat', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 80, keywords: ['צלי', 'בקר', 'roast'] },
  { id: 'lamb', nameHe: 'כבש', category: 'meat', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 120, keywords: ['כבש', 'lamb'] },
  { id: 'turkey-breast', nameHe: 'חזה הודו', category: 'meat', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 50, keywords: ['הודו', 'חזה', 'turkey'] },
  { id: 'hot-dogs', nameHe: 'נקניקיות', category: 'meat', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['נקניקיות', 'נקניק', 'hot dog'] },
  { id: 'salami', nameHe: 'סלמי', category: 'meat', defaultUnit: 'gram', defaultQuantity: 200, estimatedPrice: 25, keywords: ['סלמי', 'salami'] },
  { id: 'pastrami', nameHe: 'פסטרמה', category: 'meat', defaultUnit: 'gram', defaultQuantity: 200, estimatedPrice: 30, keywords: ['פסטרמה', 'pastrami'] },
  { id: 'salmon', nameHe: 'סלמון', category: 'meat', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 80, keywords: ['סלמון', 'salmon', 'דג'] },
  { id: 'tilapia', nameHe: 'אמנון', category: 'meat', defaultUnit: 'kg', defaultQuantity: 0.5, estimatedPrice: 40, keywords: ['אמנון', 'tilapia', 'דג'] },
  { id: 'tuna-canned', nameHe: 'טונה בקופסה', category: 'meat', defaultUnit: 'units', defaultQuantity: 2, estimatedPrice: 12, keywords: ['טונה', 'tuna', 'קופסה'] },
  { id: 'sardines', nameHe: 'סרדינים', category: 'meat', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['סרדינים', 'sardines'] },

  // ============================================
  // מאפים - BAKERY
  // ============================================
  { id: 'bread-white', nameHe: 'לחם לבן', category: 'bakery', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['לחם', 'bread'] },
  { id: 'bread-whole', nameHe: 'לחם מלא', category: 'bakery', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['לחם', 'מלא', 'bread'] },
  { id: 'bread-rye', nameHe: 'לחם שיפון', category: 'bakery', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['לחם', 'שיפון', 'rye'] },
  { id: 'pita', nameHe: 'פיתות', category: 'bakery', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 6, keywords: ['פיתה', 'פיתות', 'pita'] },
  { id: 'challah', nameHe: 'חלה', category: 'bakery', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['חלה', 'challah'] },
  { id: 'baguette', nameHe: 'באגט', category: 'bakery', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['באגט', 'baguette'] },
  { id: 'rolls', nameHe: 'לחמניות', category: 'bakery', defaultUnit: 'pack', defaultQuantity: 6, estimatedPrice: 10, keywords: ['לחמנייה', 'לחמניות', 'rolls'] },
  { id: 'croissant', nameHe: 'קרואסון', category: 'bakery', defaultUnit: 'units', defaultQuantity: 2, estimatedPrice: 12, keywords: ['קרואסון', 'croissant'] },
  { id: 'tortilla', nameHe: 'טורטייה', category: 'bakery', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['טורטייה', 'tortilla'] },
  { id: 'crackers', nameHe: 'קרקרים', category: 'bakery', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['קרקר', 'קרקרים', 'crackers'] },
  { id: 'matza', nameHe: 'מצות', category: 'bakery', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['מצה', 'מצות', 'matza'] },
  { id: 'cake', nameHe: 'עוגה', category: 'bakery', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['עוגה', 'cake'] },
  { id: 'cookies', nameHe: 'עוגיות', category: 'bakery', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['עוגיות', 'cookies'] },
  { id: 'rugelach', nameHe: 'רוגלך', category: 'bakery', defaultUnit: 'units', defaultQuantity: 4, estimatedPrice: 15, keywords: ['רוגלך', 'rugelach'] },
  { id: 'bourekas', nameHe: 'בורקס', category: 'bakery', defaultUnit: 'units', defaultQuantity: 4, estimatedPrice: 15, keywords: ['בורקס', 'bourekas'] },

  // ============================================
  // מזווה - PANTRY
  // ============================================
  { id: 'rice', nameHe: 'אורז', category: 'pantry', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 10, keywords: ['אורז', 'rice'] },
  { id: 'pasta-spaghetti', nameHe: 'ספגטי', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 6, keywords: ['ספגטי', 'פסטה', 'pasta', 'spaghetti'] },
  { id: 'pasta-penne', nameHe: 'פנה', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 6, keywords: ['פנה', 'פסטה', 'pasta', 'penne'] },
  { id: 'couscous', nameHe: 'קוסקוס', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['קוסקוס', 'couscous'] },
  { id: 'bulgur', nameHe: 'בורגול', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['בורגול', 'bulgur'] },
  { id: 'flour', nameHe: 'קמח', category: 'pantry', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 6, keywords: ['קמח', 'flour'] },
  { id: 'sugar', nameHe: 'סוכר', category: 'pantry', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 6, keywords: ['סוכר', 'sugar'] },
  { id: 'salt', nameHe: 'מלח', category: 'pantry', defaultUnit: 'kg', defaultQuantity: 1, estimatedPrice: 4, keywords: ['מלח', 'salt'] },
  { id: 'olive-oil', nameHe: 'שמן זית', category: 'pantry', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 35, keywords: ['שמן', 'זית', 'olive oil'] },
  { id: 'canola-oil', nameHe: 'שמן קנולה', category: 'pantry', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 12, keywords: ['שמן', 'קנולה', 'canola'] },
  { id: 'tomato-paste', nameHe: 'רסק עגבניות', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['רסק', 'עגבניות', 'tomato paste'] },
  { id: 'canned-tomatoes', nameHe: 'עגבניות קצוצות', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['עגבניות', 'קצוצות', 'canned tomatoes'] },
  { id: 'ketchup', nameHe: 'קטשופ', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['קטשופ', 'ketchup'] },
  { id: 'mayonnaise', nameHe: 'מיונז', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['מיונז', 'mayonnaise'] },
  { id: 'mustard', nameHe: 'חרדל', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['חרדל', 'mustard'] },
  { id: 'soy-sauce', nameHe: 'רוטב סויה', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['סויה', 'רוטב', 'soy sauce'] },
  { id: 'hummus', nameHe: 'חומוס', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['חומוס', 'hummus'] },
  { id: 'tehina', nameHe: 'טחינה', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['טחינה', 'tehina'] },
  { id: 'canned-corn', nameHe: 'תירס בקופסה', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['תירס', 'קופסה', 'corn'] },
  { id: 'canned-beans', nameHe: 'שעועית בקופסה', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['שעועית', 'קופסה', 'beans'] },
  { id: 'canned-chickpeas', nameHe: 'חומוס בקופסה', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 6, keywords: ['חומוס', 'קופסה', 'chickpeas'] },
  { id: 'lentils', nameHe: 'עדשים', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['עדשים', 'lentils'] },
  { id: 'honey', nameHe: 'דבש', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['דבש', 'honey'] },
  { id: 'jam', nameHe: 'ריבה', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['ריבה', 'jam'] },
  { id: 'chocolate-spread', nameHe: 'ממרח שוקולד', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['ממרח', 'שוקולד', 'nutella'] },
  { id: 'peanut-butter', nameHe: 'חמאת בוטנים', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 20, keywords: ['חמאת בוטנים', 'peanut butter'] },
  { id: 'olives', nameHe: 'זיתים', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['זיתים', 'olives'] },
  { id: 'pickles', nameHe: 'מלפפון חמוץ', category: 'pantry', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['מלפפון', 'חמוץ', 'pickles'] },
  { id: 'nuts-mixed', nameHe: 'אגוזים מעורב', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 25, keywords: ['אגוזים', 'nuts'] },
  { id: 'almonds', nameHe: 'שקדים', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 30, keywords: ['שקדים', 'almonds'] },
  { id: 'walnuts', nameHe: 'אגוזי מלך', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 35, keywords: ['אגוזי מלך', 'walnuts'] },
  { id: 'raisins', nameHe: 'צימוקים', category: 'pantry', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['צימוקים', 'raisins'] },

  // ============================================
  // קפואים - FROZEN
  // ============================================
  { id: 'frozen-vegetables', nameHe: 'ירקות קפואים', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['ירקות', 'קפואים', 'frozen vegetables'] },
  { id: 'frozen-peas', nameHe: 'אפונה קפואה', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['אפונה', 'קפואה', 'peas'] },
  { id: 'frozen-corn', nameHe: 'תירס קפוא', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['תירס', 'קפוא', 'corn'] },
  { id: 'frozen-fries', nameHe: "צ'יפס קפוא", category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ["צ'יפס", 'קפוא', 'fries'] },
  { id: 'frozen-pizza', nameHe: 'פיצה קפואה', category: 'frozen', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['פיצה', 'קפואה', 'pizza'] },
  { id: 'frozen-bourekas', nameHe: 'בורקס קפוא', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['בורקס', 'קפוא', 'bourekas'] },
  { id: 'ice-cream', nameHe: 'גלידה', category: 'frozen', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['גלידה', 'ice cream'] },
  { id: 'frozen-fruit', nameHe: 'פירות קפואים', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['פירות', 'קפואים', 'frozen fruit'] },
  { id: 'frozen-schnitzel', nameHe: 'שניצל קפוא', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 35, keywords: ['שניצל', 'קפוא', 'schnitzel'] },
  { id: 'frozen-fish', nameHe: 'דג קפוא', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 40, keywords: ['דג', 'קפוא', 'fish'] },
  { id: 'puff-pastry', nameHe: 'בצק עלים', category: 'frozen', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['בצק', 'עלים', 'puff pastry'] },

  // ============================================
  // משקאות - DRINKS
  // ============================================
  { id: 'water-6pack', nameHe: 'מים מינרלים 6 בקבוקים', category: 'drinks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['מים', 'water'] },
  { id: 'water-large', nameHe: 'מים 6 ליטר', category: 'drinks', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['מים', 'water'] },
  { id: 'soda', nameHe: 'סודה', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1.5, estimatedPrice: 6, keywords: ['סודה', 'soda'] },
  { id: 'cola', nameHe: 'קולה', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1.5, estimatedPrice: 8, keywords: ['קולה', 'cola'] },
  { id: 'cola-zero', nameHe: 'קולה זירו', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1.5, estimatedPrice: 8, keywords: ['קולה', 'זירו', 'cola zero'] },
  { id: 'sprite', nameHe: 'ספרייט', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1.5, estimatedPrice: 8, keywords: ['ספרייט', 'sprite'] },
  { id: 'fanta', nameHe: 'פאנטה', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1.5, estimatedPrice: 8, keywords: ['פאנטה', 'fanta'] },
  { id: 'orange-juice', nameHe: 'מיץ תפוזים', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 12, keywords: ['מיץ', 'תפוזים', 'juice', 'orange'] },
  { id: 'apple-juice', nameHe: 'מיץ תפוחים', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 12, keywords: ['מיץ', 'תפוחים', 'juice', 'apple'] },
  { id: 'grape-juice', nameHe: 'מיץ ענבים', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 15, keywords: ['מיץ', 'ענבים', 'juice', 'grape'] },
  { id: 'lemonade', nameHe: 'לימונדה', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1, estimatedPrice: 10, keywords: ['לימונדה', 'lemonade'] },
  { id: 'ice-tea', nameHe: 'אייס טי', category: 'drinks', defaultUnit: 'liter', defaultQuantity: 1.5, estimatedPrice: 8, keywords: ['אייס טי', 'ice tea'] },
  { id: 'coffee', nameHe: 'קפה', category: 'drinks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 25, keywords: ['קפה', 'coffee'] },
  { id: 'coffee-capsules', nameHe: 'קפסולות קפה', category: 'drinks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 30, keywords: ['קפסולות', 'קפה', 'capsules'] },
  { id: 'tea', nameHe: 'תה', category: 'drinks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['תה', 'tea'] },
  { id: 'wine-red', nameHe: 'יין אדום', category: 'drinks', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 40, keywords: ['יין', 'אדום', 'wine'] },
  { id: 'wine-white', nameHe: 'יין לבן', category: 'drinks', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 40, keywords: ['יין', 'לבן', 'wine'] },
  { id: 'beer', nameHe: 'בירה', category: 'drinks', defaultUnit: 'pack', defaultQuantity: 6, estimatedPrice: 40, keywords: ['בירה', 'beer'] },

  // ============================================
  // חטיפים - SNACKS
  // ============================================
  { id: 'bamba', nameHe: 'במבה', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['במבה', 'bamba', 'חטיף'] },
  { id: 'bisli', nameHe: 'ביסלי', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['ביסלי', 'bisli', 'חטיף'] },
  { id: 'apropo', nameHe: 'אפרופו', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['אפרופו', 'apropo', 'חטיף'] },
  { id: 'doritos', nameHe: 'דוריטוס', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['דוריטוס', 'doritos'] },
  { id: 'chips', nameHe: "צ'יפס", category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ["צ'יפס", 'chips'] },
  { id: 'popcorn', nameHe: 'פופקורן', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['פופקורן', 'popcorn'] },
  { id: 'pretzels', nameHe: 'בייגלה', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['בייגלה', 'pretzels'] },
  { id: 'chocolate-bar', nameHe: 'שוקולד', category: 'snacks', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['שוקולד', 'chocolate'] },
  { id: 'chocolate-kinder', nameHe: 'קינדר', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['קינדר', 'kinder'] },
  { id: 'kif-kef', nameHe: 'כיף כף', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['כיף כף'] },
  { id: 'pesek-zman', nameHe: 'פסק זמן', category: 'snacks', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 8, keywords: ['פסק זמן'] },
  { id: 'krembo', nameHe: 'קרמבו', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['קרמבו', 'krembo'] },
  { id: 'kerit', nameHe: 'כריות', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 24, keywords: ['כריות', 'דגני בוקר'] },
  { id: 'cornflakes', nameHe: 'קורנפלקס', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 18, keywords: ['קורנפלקס', 'cornflakes', 'דגני בוקר'] },
  { id: 'granola', nameHe: 'גרנולה', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 22, keywords: ['גרנולה', 'granola', 'דגני בוקר'] },
  { id: 'energy-bar', nameHe: 'חטיף אנרגיה', category: 'snacks', defaultUnit: 'units', defaultQuantity: 3, estimatedPrice: 15, keywords: ['חטיף', 'אנרגיה', 'energy bar'] },
  { id: 'gummy-bears', nameHe: 'דובוני גומי', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['דובוני גומי', 'gummy'] },
  { id: 'wafers', nameHe: 'וופלים', category: 'snacks', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 8, keywords: ['וופלים', 'wafers'] },

  // ============================================
  // ניקיון - CLEANING
  // ============================================
  { id: 'dish-soap', nameHe: 'סבון כלים', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['סבון', 'כלים', 'dish soap'] },
  { id: 'dishwasher-tabs', nameHe: 'טבליות למדיח', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 35, keywords: ['טבליות', 'מדיח', 'dishwasher'] },
  { id: 'laundry-detergent', nameHe: 'אבקת כביסה', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 35, keywords: ['כביסה', 'אבקה', 'laundry'] },
  { id: 'fabric-softener', nameHe: 'מרכך כביסה', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 20, keywords: ['מרכך', 'כביסה', 'softener'] },
  { id: 'bleach', nameHe: 'אקונומיקה', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['אקונומיקה', 'bleach'] },
  { id: 'floor-cleaner', nameHe: 'נוזל רצפות', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['רצפות', 'נוזל', 'floor cleaner'] },
  { id: 'glass-cleaner', nameHe: 'נוזל חלונות', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['חלונות', 'נוזל', 'glass cleaner'] },
  { id: 'toilet-cleaner', nameHe: 'נוזל לשירותים', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['שירותים', 'נוזל', 'toilet cleaner'] },
  { id: 'sponges', nameHe: 'ספוגים', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['ספוג', 'ספוגים', 'sponge'] },
  { id: 'paper-towels', nameHe: 'מגבות נייר', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['מגבות', 'נייר', 'paper towels'] },
  { id: 'toilet-paper', nameHe: 'נייר טואלט', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 25, keywords: ['נייר', 'טואלט', 'toilet paper'] },
  { id: 'tissues', nameHe: 'טישו', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['טישו', 'tissues'] },
  { id: 'trash-bags', nameHe: 'שקיות אשפה', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['שקיות', 'אשפה', 'trash bags'] },
  { id: 'aluminum-foil', nameHe: 'נייר אלומיניום', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['אלומיניום', 'נייר', 'foil'] },
  { id: 'plastic-wrap', nameHe: 'ניילון נצמד', category: 'cleaning', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 10, keywords: ['ניילון', 'נצמד', 'plastic wrap'] },
  { id: 'ziplock-bags', nameHe: 'שקיות זיפלוק', category: 'cleaning', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['זיפלוק', 'שקיות', 'ziplock'] },

  // ============================================
  // טיפוח - PERSONAL CARE
  // ============================================
  { id: 'shampoo', nameHe: 'שמפו', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 20, keywords: ['שמפו', 'shampoo'] },
  { id: 'conditioner', nameHe: 'מרכך שיער', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 20, keywords: ['מרכך', 'שיער', 'conditioner'] },
  { id: 'body-wash', nameHe: 'סבון גוף', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 18, keywords: ['סבון', 'גוף', 'body wash'] },
  { id: 'soap-bar', nameHe: 'סבון מוצק', category: 'personal', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['סבון', 'מוצק', 'soap'] },
  { id: 'hand-soap', nameHe: 'סבון ידיים', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['סבון', 'ידיים', 'hand soap'] },
  { id: 'toothpaste', nameHe: 'משחת שיניים', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 12, keywords: ['משחת שיניים', 'toothpaste'] },
  { id: 'toothbrush', nameHe: 'מברשת שיניים', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 15, keywords: ['מברשת', 'שיניים', 'toothbrush'] },
  { id: 'mouthwash', nameHe: 'מי פה', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 18, keywords: ['מי פה', 'mouthwash'] },
  { id: 'deodorant', nameHe: 'דאודורנט', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 20, keywords: ['דאודורנט', 'deodorant'] },
  { id: 'razor', nameHe: 'סכיני גילוח', category: 'personal', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 25, keywords: ['גילוח', 'סכינים', 'razor'] },
  { id: 'shaving-cream', nameHe: 'קצף גילוח', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 18, keywords: ['גילוח', 'קצף', 'shaving cream'] },
  { id: 'face-cream', nameHe: 'קרם פנים', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 30, keywords: ['קרם', 'פנים', 'face cream'] },
  { id: 'body-lotion', nameHe: 'קרם גוף', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['קרם', 'גוף', 'body lotion'] },
  { id: 'sunscreen', nameHe: 'קרם הגנה', category: 'personal', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 40, keywords: ['הגנה', 'קרם', 'sunscreen'] },
  { id: 'cotton-pads', nameHe: 'פדים', category: 'personal', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 12, keywords: ['פדים', 'cotton pads'] },
  { id: 'cotton-buds', nameHe: 'מקלוני אוזניים', category: 'personal', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 10, keywords: ['מקלונים', 'אוזניים', 'cotton buds'] },
  { id: 'feminine-pads', nameHe: 'תחבושות', category: 'personal', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['תחבושות', 'pads'] },
  { id: 'tampons', nameHe: 'טמפונים', category: 'personal', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 25, keywords: ['טמפונים', 'tampons'] },

  // ============================================
  // תינוקות - BABY
  // ============================================
  { id: 'diapers', nameHe: 'חיתולים', category: 'baby', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 50, keywords: ['חיתולים', 'diapers'] },
  { id: 'baby-wipes', nameHe: 'מגבונים לתינוק', category: 'baby', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 15, keywords: ['מגבונים', 'תינוק', 'baby wipes'] },
  { id: 'baby-formula', nameHe: 'תמ"ל', category: 'baby', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 60, keywords: ['תמ"ל', 'formula', 'תינוק'] },
  { id: 'baby-food', nameHe: 'מזון תינוקות', category: 'baby', defaultUnit: 'units', defaultQuantity: 3, estimatedPrice: 15, keywords: ['מזון', 'תינוקות', 'baby food'] },
  { id: 'baby-cereal', nameHe: 'דגנים לתינוק', category: 'baby', defaultUnit: 'pack', defaultQuantity: 1, estimatedPrice: 20, keywords: ['דגנים', 'תינוק', 'baby cereal'] },
  { id: 'baby-shampoo', nameHe: 'שמפו לתינוק', category: 'baby', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['שמפו', 'תינוק', 'baby shampoo'] },
  { id: 'baby-lotion', nameHe: 'קרם לתינוק', category: 'baby', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 25, keywords: ['קרם', 'תינוק', 'baby lotion'] },
  { id: 'baby-oil', nameHe: 'שמן לתינוק', category: 'baby', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 20, keywords: ['שמן', 'תינוק', 'baby oil'] },
  { id: 'pacifier', nameHe: 'מוצץ', category: 'baby', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 30, keywords: ['מוצץ', 'pacifier'] },
  { id: 'baby-bottle', nameHe: 'בקבוק תינוק', category: 'baby', defaultUnit: 'units', defaultQuantity: 1, estimatedPrice: 35, keywords: ['בקבוק', 'תינוק', 'bottle'] },
];

/**
 * Keywords map for smart categorization
 * When a user types an item, we can guess the category based on these keywords
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  vegetables: ['ירק', 'ירקות', 'עגבני', 'מלפפון', 'גזר', 'בצל', 'פלפל', 'חסה', 'כרוב', 'קישוא', 'חציל', 'שום', 'פטרוזיליה', 'כוסברה', 'שמיר', 'נענע', 'סלרי', 'פטרי', 'תירס', 'ברוקולי', 'כרובית', 'בטטה', 'דלעת', 'צנון', 'סלק', 'תרד', 'כריש'],
  fruits: ['פרי', 'פירות', 'תפוח', 'בננ', 'תפוז', 'קלמנטינ', 'ענב', 'אבטיח', 'מלון', 'אפרסק', 'נקטרינ', 'שזיף', 'אגס', 'תות', 'אוכמני', 'פטל', 'מנגו', 'אבוקדו', 'לימון', 'ליים', 'רימון', 'קיווי', 'אננס', 'תמר', 'תאנ'],
  dairy: ['חלב', 'גבינ', 'יוגורט', "קוטג'", 'שמנת', 'חמאה', 'מרגרינ', 'לבן', 'ביצ', 'שוקו', 'מעדן', 'פודינג', 'מוצרל', 'פרמזן', 'פטה', 'צפתית'],
  meat: ['בשר', 'עוף', 'חזה', 'ירכ', 'כנפ', 'שניצל', 'טחון', 'סטייק', 'צלי', 'כבש', 'הודו', 'נקניק', 'סלמי', 'פסטרמ', 'סלמון', 'דג', 'אמנון', 'טונה', 'סרדינ'],
  bakery: ['לחם', 'פית', 'חל', 'באגט', 'לחמני', 'קרואסון', 'טורטי', 'קרקר', 'מצ', 'עוג', 'רוגלך', 'בורקס'],
  pantry: ['אורז', 'פסטה', 'ספגטי', 'פנה', 'קוסקוס', 'בורגול', 'קמח', 'סוכר', 'מלח', 'שמן', 'רסק', 'קטשופ', 'מיונז', 'חרדל', 'סויה', 'חומוס', 'טחינ', 'עדש', 'דבש', 'ריב', 'ממרח', 'זית', 'חמוץ', 'אגוז', 'שקד', 'צימוק'],
  frozen: ['קפוא', 'קפואה', 'קפואים', 'גלידה', 'פיצה קפוא', 'בצק'],
  drinks: ['מים', 'סודה', 'קולה', 'ספרייט', 'פאנטה', 'מיץ', 'לימונדה', 'אייס טי', 'קפה', 'תה', 'יין', 'בירה'],
  snacks: ['במבה', 'ביסלי', 'אפרופו', 'דוריטוס', "צ'יפס", 'פופקורן', 'בייגל', 'שוקולד', 'קינדר', 'כיף כף', 'פסק זמן', 'קרמבו', 'כרית', 'קורנפלקס', 'גרנולה', 'וופל', 'גומי'],
  cleaning: ['סבון כלים', 'מדיח', 'כביס', 'מרכך', 'אקונומיקה', 'רצפ', 'חלונ', 'שירות', 'ספוג', 'מגבות נייר', 'נייר טואלט', 'טישו', 'שקיות אשפה', 'אלומיניום', 'ניילון', 'זיפלוק'],
  personal: ['שמפו', 'מרכך שיער', 'סבון גוף', 'סבון ידיים', 'משחת שיני', 'מברשת שיני', 'מי פה', 'דאודורנט', 'גילוח', 'קרם', 'הגנה', 'פדים', 'מקלונ', 'תחבוש', 'טמפונ'],
  baby: ['חיתול', 'מגבונ', 'תמ"ל', 'תינוק', 'מוצץ', 'בקבוק תינוק'],
};
