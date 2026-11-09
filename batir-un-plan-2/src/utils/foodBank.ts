import type { FoodItem, FoodCategory, DayFoodBank, MealSlot, MealSlotData, MealSlotPortion } from '../types';

// ─── Exact portion averages (per 1 portion, from original HTML) ───────────────
// kcal computed via 4·P + 4·G + 9·L
export interface PortionAvg {
  p: number; // protein g
  g: number; // glucides g
  l: number; // lipides g
  kcal: number;
}

export const PORTION_AVERAGES: Record<FoodCategory, PortionAvg> = {
  proteines: { p:  9, g:  0, l: 2, kcal: 9*4+0*4+2*9  },  // 54
  feculent:  { p:  3, g: 18, l: 1, kcal: 3*4+18*4+1*9  }, // 93
  legumes:   { p:  2, g:  7, l: 0, kcal: 2*4+7*4+0*9   }, // 36
  fruits:    { p:  1, g: 15, l: 2, kcal: 1*4+15*4+2*9  }, // 82
  laitiers:  { p:  7, g: 10, l: 2, kcal: 7*4+10*4+2*9  }, // 86
  graisses:  { p:  1, g:  2, l: 6, kcal: 1*4+2*4+6*9   }, // 66
  whey:      { p: 22, g:  2, l: 2, kcal: 22*4+2*4+2*9  }, // 114
};

// ─── Food item catalogue (illustrative choices per category) ─────────────────
// Nutritional values per item are ILLUSTRATIVE — totals use PORTION_AVERAGES above.
export const FOOD_ITEMS: Record<FoodCategory, FoodItem[]> = {
  proteines: [
    { id: 'volaille',       nom: 'Volaille (blanc)',       poidsG: 100, proteines: 25, glucides: 0,  lipides:  3, kcal: 127 },
    { id: 'viande_rouge',   nom: 'Viande rouge',           poidsG: 100, proteines: 20, glucides: 0,  lipides: 10, kcal: 170 },
    { id: 'poisson_maigre', nom: 'Poisson maigre',         poidsG: 100, proteines: 20, glucides: 0,  lipides:  2, kcal:  98 },
    { id: 'poisson_gras',   nom: 'Poisson gras (saumon)',  poidsG: 100, proteines: 20, glucides: 0,  lipides: 10, kcal: 170 },
    { id: 'oeufs',          nom: 'Œufs entiers (3)',        poidsG: 150, proteines: 18, glucides: 1,  lipides: 15, kcal: 207 },
    { id: 'thon_boite',     nom: 'Thon en boîte',          poidsG:  80, proteines: 18, glucides: 0,  lipides:  2, kcal:  88 },
    { id: 'crevettes',      nom: 'Crevettes',              poidsG: 100, proteines: 18, glucides: 1,  lipides:  2, kcal:  90 },
  ],
  feculent: [
    { id: 'riz',            nom: 'Riz cuit',               poidsG: 150, proteines:  4, glucides: 32, lipides:  1, kcal: 153 },
    { id: 'pates',          nom: 'Pâtes cuites',           poidsG: 150, proteines:  5, glucides: 32, lipides:  1, kcal: 155 },
    { id: 'pomme_de_terre', nom: 'Pommes de terre',        poidsG: 200, proteines:  4, glucides: 36, lipides:  0, kcal: 160 },
    { id: 'avoine',         nom: 'Flocons d\'avoine',      poidsG:  60, proteines:  7, glucides: 37, lipides:  4, kcal: 212 },
    { id: 'patate_douce',   nom: 'Patate douce',           poidsG: 200, proteines:  4, glucides: 40, lipides:  0, kcal: 176 },
    { id: 'pain_complet',   nom: 'Pain complet',           poidsG:  60, proteines:  6, glucides: 32, lipides:  2, kcal: 170 },
    { id: 'quinoa',         nom: 'Quinoa cuit',            poidsG: 150, proteines:  6, glucides: 27, lipides:  2, kcal: 148 },
  ],
  legumes: [
    { id: 'legumes_verts',  nom: 'Légumes verts variés',   poidsG: 200, proteines:  4, glucides: 10, lipides:  0, kcal:  56 },
    { id: 'brocoli',        nom: 'Brocoli',                poidsG: 200, proteines:  5, glucides:  8, lipides:  0, kcal:  52 },
    { id: 'epinards',       nom: 'Épinards',               poidsG: 200, proteines:  5, glucides:  6, lipides:  1, kcal:  52 },
    { id: 'courgettes',     nom: 'Courgettes',             poidsG: 200, proteines:  3, glucides:  7, lipides:  0, kcal:  40 },
    { id: 'salade',         nom: 'Salade verte',           poidsG: 100, proteines:  1, glucides:  2, lipides:  0, kcal:  16 },
  ],
  fruits: [
    { id: 'banane',         nom: 'Banane',                 poidsG: 100, proteines:  1, glucides: 23, lipides:  0, kcal:  96 },
    { id: 'pomme',          nom: 'Pomme',                  poidsG: 150, proteines:  0, glucides: 20, lipides:  0, kcal:  78 },
    { id: 'fruits_rouges',  nom: 'Fruits rouges (mix)',    poidsG: 150, proteines:  2, glucides: 15, lipides:  0, kcal:  68 },
    { id: 'orange',         nom: 'Orange',                 poidsG: 150, proteines:  1, glucides: 17, lipides:  0, kcal:  72 },
    { id: 'raisin',         nom: 'Raisin',                 poidsG: 100, proteines:  1, glucides: 17, lipides:  0, kcal:  72 },
  ],
  laitiers: [
    { id: 'fromage_blanc',  nom: 'Fromage blanc 0%',       poidsG: 200, proteines: 15, glucides:  7, lipides:  0, kcal:  88 },
    { id: 'yaourt_nature',  nom: 'Yaourt nature',          poidsG: 125, proteines:  5, glucides:  7, lipides:  2, kcal:  64 },
    { id: 'lait',           nom: 'Lait demi-écrémé',       poidsG: 250, proteines:  8, glucides: 12, lipides:  4, kcal: 116 },
    { id: 'skyr',           nom: 'Skyr nature',            poidsG: 150, proteines: 18, glucides:  6, lipides:  0, kcal:  96 },
    { id: 'cottage',        nom: 'Cottage cheese',         poidsG: 150, proteines: 17, glucides:  4, lipides:  2, kcal: 102 },
  ],
  graisses: [
    { id: 'huile_olive',    nom: 'Huile d\'olive',         poidsG:  10, proteines:  0, glucides:  0, lipides: 10, kcal:  90 },
    { id: 'beurre',         nom: 'Beurre',                 poidsG:  10, proteines:  0, glucides:  0, lipides:  8, kcal:  72 },
    { id: 'avocat',         nom: 'Avocat (½)',             poidsG:  75, proteines:  1, glucides:  3, lipides: 11, kcal: 115 },
    { id: 'oleagineux',     nom: 'Noix / oléagineux',      poidsG:  15, proteines:  3, glucides:  2, lipides:  9, kcal:  97 },
    { id: 'huile_coco',     nom: 'Huile de coco',          poidsG:  10, proteines:  0, glucides:  0, lipides: 10, kcal:  90 },
  ],
  whey: [
    { id: 'whey_std',       nom: 'Whey protéine (1 dose)', poidsG:  30, proteines: 24, glucides:  2, lipides:  1, kcal: 113 },
    { id: 'whey_isolat',    nom: 'Whey isolat (1 dose)',   poidsG:  30, proteines: 27, glucides:  0, lipides:  0, kcal: 108 },
    { id: 'caseine',        nom: 'Caséine (1 dose)',       poidsG:  35, proteines: 24, glucides:  3, lipides:  1, kcal: 117 },
  ],
};

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  proteines: 'Protéines',
  feculent:  'Féculents',
  legumes:   'Légumes',
  fruits:    'Fruits',
  laitiers:  'Produits laitiers',
  graisses:  'Matières grasses',
  whey:      'Whey / Suppléments',
};

export const FOOD_CATEGORIES: FoodCategory[] = [
  'proteines', 'feculent', 'legumes', 'fruits', 'laitiers', 'graisses', 'whey',
];

// ─── Default food bank ────────────────────────────────────────────────────────
export function defaultFoodBank(): DayFoodBank {
  return {
    proteines: 2, feculent: 3, legumes: 2, fruits: 2, laitiers: 1, graisses: 2, whey: 1,
    selectedProteines: 'volaille',
    selectedFeculent: 'riz',
    selectedLegumes: 'legumes_verts',
    selectedFruits: 'pomme',
    selectedLaitiers: 'fromage_blanc',
    selectedGraisses: 'huile_olive',
    selectedWhey: 'whey_std',
  };
}

// ─── Helper: get selected item for a category ─────────────────────────────────
export function getFoodItem(category: FoodCategory, id: string): FoodItem | undefined {
  return FOOD_ITEMS[category].find(f => f.id === id);
}

export function getSelectedItem(bank: DayFoodBank, cat: FoodCategory): FoodItem | undefined {
  const key = `selected${cat.charAt(0).toUpperCase() + cat.slice(1)}` as keyof DayFoodBank;
  return getFoodItem(cat, bank[key] as string);
}

// ─── Compute totals using PORTION_AVERAGES ────────────────────────────────────
// IMPORTANT: totals are based on category averages, not on individual food items.
// The food item selector is for display/meal planning purposes only.
export interface BankTotals {
  proteines: number;
  glucides:  number;
  lipides:   number;
  kcal:      number;
}

export function computeBankTotals(bank: DayFoodBank): BankTotals {
  let p = 0, g = 0, l = 0, k = 0;
  for (const cat of FOOD_CATEGORIES) {
    const qty = bank[cat as keyof DayFoodBank] as number;
    if (!qty) continue;
    const avg = PORTION_AVERAGES[cat];
    p += avg.p * qty;
    g += avg.g * qty;
    l += avg.l * qty;
    k += avg.kcal * qty;
  }
  return { proteines: Math.round(p), glucides: Math.round(g), lipides: Math.round(l), kcal: Math.round(k) };
}

// ─── Meal slot labels / order ─────────────────────────────────────────────────
export const MEAL_SLOT_LABELS: Record<string, string> = {
  petitDejeuner:  'Petit-déjeuner',
  collationMatin: 'Collation matin',
  dejeuner:       'Déjeuner',
  collationAprem: 'Collation après-midi',
  diner:          'Dîner',
  collationSoir:  'Collation soir',
};

export const MEAL_SLOTS = [
  'petitDejeuner',
  'collationMatin',
  'dejeuner',
  'collationAprem',
  'diner',
  'collationSoir',
] as const;

// ─── Default empty meals ──────────────────────────────────────────────────────
export function defaultMealSlot(slot: string): MealSlotData {
  return { slot: slot as MealSlot, portions: [], customNotes: '' };
}

export function defaultMeals(): Record<MealSlot, MealSlotData> {
  return Object.fromEntries(
    MEAL_SLOTS.map(s => [s, defaultMealSlot(s)])
  ) as Record<MealSlot, MealSlotData>;
}

// ─── Meal distribution presets ────────────────────────────────────────────────
// 3 modes: classique, performance, equilibree
// Weights per meal slot: [PD, CollMatin, Dej, CollAprem, Din, CollSoir]

/** Weights for the 'classique' distribution (all categories, from original HTML) */
const CLASSIQUE_WEIGHTS = [0.30, 0.05, 0.25, 0.10, 0.25, 0.05];

/** 'performance': shifts carb/protein weight toward pre/post training meals
 *  (approximate — exact rule not in source; concentrates meals 1+2 pre, meal 3 post) */
const PERFORMANCE_WEIGHTS = [0.25, 0.15, 0.30, 0.05, 0.20, 0.05];

/** 'equilibree': equal 1/6 each */
const EQUILIBREE_WEIGHTS = [1/6, 1/6, 1/6, 1/6, 1/6, 1/6];

export type PortionMap = Partial<Record<MealSlot, Partial<Record<FoodCategory, number>>>>;

function applyWeights(bank: DayFoodBank, weights: number[]): PortionMap {
  const result: PortionMap = {};
  for (const slot of MEAL_SLOTS) result[slot] = {};

  for (const cat of FOOD_CATEGORIES) {
    const total = bank[cat as keyof DayFoodBank] as number;
    if (!total) continue;

    let allocated = 0;
    for (let i = 0; i < MEAL_SLOTS.length; i++) {
      const slot = MEAL_SLOTS[i];
      if (i < MEAL_SLOTS.length - 1) {
        const qty = Math.round(total * weights[i] * 10) / 10;  // 0.5 portion precision
        if (qty > 0) result[slot]![cat as FoodCategory] = qty;
        allocated += qty;
      } else {
        // Last slot gets remainder to avoid rounding drift
        const rem = Math.round((total - allocated) * 10) / 10;
        if (rem > 0) result[slot]![cat as FoodCategory] = rem;
      }
    }
  }
  return result;
}

export function distributeClassique(bank: DayFoodBank): PortionMap {
  return applyWeights(bank, CLASSIQUE_WEIGHTS);
}

export function distributePerformance(bank: DayFoodBank): PortionMap {
  return applyWeights(bank, PERFORMANCE_WEIGHTS);
}

export function distributeEquilibree(bank: DayFoodBank): PortionMap {
  return applyWeights(bank, EQUILIBREE_WEIGHTS);
}

// ─── Convert PortionMap → Record<MealSlot, MealSlotData> ─────────────────────
export function portionMapToMeals(map: PortionMap): Record<MealSlot, MealSlotData> {
  const result = defaultMeals();
  for (const slot of MEAL_SLOTS) {
    const slotData = map[slot];
    if (!slotData) continue;
    const portions: MealSlotPortion[] = [];
    for (const [cat, qty] of Object.entries(slotData)) {
      if ((qty ?? 0) > 0) portions.push({ category: cat as FoodCategory, portions: qty! });
    }
    result[slot] = { slot, portions, customNotes: '' };
  }
  return result;
}
