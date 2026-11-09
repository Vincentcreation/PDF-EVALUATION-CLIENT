import type { FoodItem, FoodCategory, DayFoodBank, MealSlot, MealSlotData, MealSlotPortion } from '../types';

// ─── Food Bank Data ───────────────────────────────────────────────────────────
// Standard French sports nutrition food equivalents.
// NOTE: exact portion values not confirmed from source HTML — verify if available.

export const FOOD_ITEMS: Record<FoodCategory, FoodItem[]> = {
  proteines: [
    { id: 'viande_rouge',   nom: 'Viande rouge',          poidsG: 100, proteines: 20, glucides: 0,  lipides: 10, kcal: 170 },
    { id: 'volaille',       nom: 'Volaille (blanc)',       poidsG: 100, proteines: 25, glucides: 0,  lipides:  3, kcal: 127 },
    { id: 'poisson_maigre', nom: 'Poisson maigre',         poidsG: 100, proteines: 20, glucides: 0,  lipides:  2, kcal:  98 },
    { id: 'poisson_gras',   nom: 'Poisson gras (saumon)',  poidsG: 100, proteines: 20, glucides: 0,  lipides: 10, kcal: 170 },
    { id: 'oeufs',          nom: 'Œufs entiers (3)',       poidsG: 150, proteines: 18, glucides: 1,  lipides: 15, kcal: 207 },
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

export const CATEGORY_COLORS: Record<FoodCategory, string> = {
  proteines: 'text-sky-400 bg-sky-900/20 border-sky-800',
  feculent:  'text-amber-400 bg-amber-900/20 border-amber-800',
  legumes:   'text-emerald-400 bg-emerald-900/20 border-emerald-800',
  fruits:    'text-pink-400 bg-pink-900/20 border-pink-800',
  laitiers:  'text-purple-400 bg-purple-900/20 border-purple-800',
  graisses:  'text-orange-400 bg-orange-900/20 border-orange-800',
  whey:      'text-gold-400 bg-yellow-900/20 border-yellow-800',
};

export const FOOD_CATEGORIES: FoodCategory[] = [
  'proteines', 'feculent', 'legumes', 'fruits', 'laitiers', 'graisses', 'whey',
];

// ─── Default food bank ───────────────────────────────────────────────────────
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

// ─── Get food item by category & id ─────────────────────────────────────────
export function getFoodItem(category: FoodCategory, id: string): FoodItem | undefined {
  return FOOD_ITEMS[category].find(f => f.id === id);
}

export function getSelectedItem(bank: DayFoodBank, cat: FoodCategory): FoodItem | undefined {
  const selectedKey = `selected${cat.charAt(0).toUpperCase() + cat.slice(1)}` as keyof DayFoodBank;
  return getFoodItem(cat, bank[selectedKey] as string);
}

// ─── Compute totals from food bank ───────────────────────────────────────────
export interface BankTotals {
  proteines: number;
  glucides: number;
  lipides: number;
  kcal: number;
}

export function computeBankTotals(bank: DayFoodBank): BankTotals {
  let p = 0, g = 0, l = 0, k = 0;
  for (const cat of FOOD_CATEGORIES) {
    const item = getSelectedItem(bank, cat);
    if (!item) continue;
    const portions = bank[cat as keyof DayFoodBank] as number;
    p += item.proteines * portions;
    g += item.glucides  * portions;
    l += item.lipides   * portions;
    k += item.kcal      * portions;
  }
  return { proteines: Math.round(p), glucides: Math.round(g), lipides: Math.round(l), kcal: Math.round(k) };
}

// ─── Meal slot labels ────────────────────────────────────────────────────────
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

// ─── Default empty meal slot ─────────────────────────────────────────────────
export function defaultMealSlot(slot: string): MealSlotData {
  return { slot: slot as MealSlot, portions: [], customNotes: '' };
}

export function defaultMeals(): Record<MealSlot, MealSlotData> {
  return Object.fromEntries(
    MEAL_SLOTS.map(s => [s, defaultMealSlot(s)])
  ) as Record<MealSlot, MealSlotData>;
}

// ─── Automatic distribution ───────────────────────────────────────────────────
// Distributes food bank portions across 6 meals.
// Mode 'classique': standard 25/0/35/0/30/10 caloric split (approximate).
// Mode 'entrainement': more carbs pre/post workout.
// Mode 'equilibree': even split.
// NOTE: exact rules not confirmed from source HTML — verify if available.

type PortionMap = Partial<Record<MealSlot, Partial<Record<FoodCategory, number>>>>;

export function distributeClassique(bank: DayFoodBank): PortionMap {
  // Classic: PD 25% / Lunch 35% / Dinner 30% / snacks 10%
  return {
    petitDejeuner: {
      feculent: Math.round(bank.feculent * 0.25),
      laitiers: bank.laitiers,
      fruits: Math.min(1, bank.fruits),
      graisses: Math.round(bank.graisses * 0.3),
    },
    collationMatin: {
      fruits: Math.max(0, bank.fruits - 1),
      whey: bank.whey > 0 ? Math.ceil(bank.whey / 2) : 0,
    },
    dejeuner: {
      proteines: Math.round(bank.proteines * 0.5),
      feculent: Math.round(bank.feculent * 0.35),
      legumes: Math.round(bank.legumes * 0.5),
      graisses: Math.round(bank.graisses * 0.35),
    },
    collationAprem: {
      whey: bank.whey > 0 ? Math.floor(bank.whey / 2) : 0,
    },
    diner: {
      proteines: Math.round(bank.proteines * 0.5),
      feculent: Math.max(0, bank.feculent - Math.round(bank.feculent * 0.25) - Math.round(bank.feculent * 0.35)),
      legumes: Math.round(bank.legumes * 0.5),
      graisses: Math.max(0, bank.graisses - Math.round(bank.graisses * 0.3) - Math.round(bank.graisses * 0.35)),
    },
    collationSoir: {},
  };
}

export function distributeEntrainement(bank: DayFoodBank, trainingTime: 'matin' | 'midi' | 'soir'): PortionMap {
  // More carbs pre/post workout
  if (trainingTime === 'matin') {
    return {
      petitDejeuner: { feculent: Math.round(bank.feculent * 0.3), fruits: 1, graisses: Math.round(bank.graisses * 0.2) },
      collationMatin: { feculent: Math.round(bank.feculent * 0.2), proteines: 1, whey: bank.whey },
      dejeuner: { proteines: Math.round(bank.proteines * 0.4), feculent: Math.round(bank.feculent * 0.25), legumes: Math.round(bank.legumes * 0.5), graisses: Math.round(bank.graisses * 0.4), laitiers: bank.laitiers },
      collationAprem: { fruits: Math.max(0, bank.fruits - 1) },
      diner: { proteines: Math.max(0, bank.proteines - 1 - Math.round(bank.proteines * 0.4)), feculent: Math.max(0, bank.feculent - Math.round(bank.feculent * 0.75)), legumes: Math.round(bank.legumes * 0.5), graisses: Math.max(0, bank.graisses - Math.round(bank.graisses * 0.6)) },
      collationSoir: {},
    };
  }
  // Default to classique for midi/soir (simplified)
  return distributeClassique(bank);
}

export function distributeEquilibree(bank: DayFoodBank): PortionMap {
  // Even 3-way split across PD / Lunch / Dinner, snacks for extras
  const meals3 = ['petitDejeuner', 'dejeuner', 'diner'] as MealSlot[];
  const result: PortionMap = {};
  for (const slot of MEAL_SLOTS) result[slot] = {};

  for (const cat of FOOD_CATEGORIES) {
    const total = bank[cat as keyof DayFoodBank] as number;
    if (total === 0) continue;
    const perMeal = Math.floor(total / 3);
    const remainder = total - perMeal * 3;
    meals3.forEach((m, i) => {
      result[m]![cat as FoodCategory] = perMeal + (i === 0 ? remainder : 0);
    });
  }
  // Whey to snacks
  if (bank.whey > 0) {
    result.collationMatin!.whey = Math.ceil(bank.whey / 2);
    result.collationAprem!.whey = Math.floor(bank.whey / 2);
    result.petitDejeuner!.whey = 0;
    result.dejeuner!.whey = 0;
    result.diner!.whey = 0;
  }
  return result;
}

// ─── Convert PortionMap to MealSlotData array ─────────────────────────────────
export function portionMapToMeals(map: PortionMap): Record<MealSlot, MealSlotData> {
  const result = defaultMeals();
  for (const slot of MEAL_SLOTS) {
    const slotData = map[slot];
    if (!slotData) continue;
    const portions: MealSlotPortion[] = [];
    for (const [cat, qty] of Object.entries(slotData)) {
      if ((qty ?? 0) > 0) {
        portions.push({ category: cat as FoodCategory, portions: qty! });
      }
    }
    result[slot] = { slot, portions, customNotes: '' };
  }
  return result;
}
