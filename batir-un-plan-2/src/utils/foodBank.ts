import type { FoodItem, FoodCategory, DayFoodBank, MealSlot, MealSlotData, MealSlotPortion } from '../types';

// ─── Single source of truth: portion averages per category ───────────────────
// All nutrition values (bank, meals, PDF, validation) derive from these.
// Food item choices are illustrative guidance only.
export interface PortionAvg {
  p: number;    // protein g
  g: number;    // glucides g
  l: number;    // lipides g
  kcal: number; // = 4p + 4g + 9l
}

export const PORTION_AVERAGES: Record<FoodCategory, PortionAvg> = {
  proteines: { p:  9, g:  0, l: 2, kcal:  54 },
  feculent:  { p:  3, g: 18, l: 1, kcal:  93 },
  legumes:   { p:  2, g:  7, l: 0, kcal:  36 },
  fruits:    { p:  1, g: 15, l: 2, kcal:  82 },
  laitiers:  { p:  7, g: 10, l: 2, kcal:  86 },
  graisses:  { p:  1, g:  2, l: 6, kcal:  66 },
  whey:      { p: 22, g:  2, l: 2, kcal: 114 },
};

// ─── Food item catalogue (illustrative food choices per category) ─────────────
// Nutritional values per item are ILLUSTRATIVE — NOT used in calculations.
// All calculations use PORTION_AVERAGES above.
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

// ─── Quebec meal slot labels ──────────────────────────────────────────────────
// Quebec French uses different meal names from European French.
export const MEAL_SLOT_LABELS: Record<string, string> = {
  petitDejeuner:  'Déjeuner',       // breakfast in QC
  collationMatin: 'Collation AM',
  dejeuner:       'Dîner',          // lunch in QC
  collationAprem: 'Collation PM',
  diner:          'Souper',         // dinner in QC
  collationSoir:  'Collation Soirée',
};

export const MEAL_SLOTS = [
  'petitDejeuner',
  'collationMatin',
  'dejeuner',
  'collationAprem',
  'diner',
  'collationSoir',
] as const;

// Approximate start hour of each meal slot (used for pre/post workout detection)
export const MEAL_SLOT_HOURS: Record<MealSlot, number> = {
  petitDejeuner:  7.0,
  collationMatin: 10.0,
  dejeuner:       12.0,
  collationAprem: 15.0,
  diner:          18.0,
  collationSoir:  21.0,
};

// ─── Default food bank ────────────────────────────────────────────────────────
export function defaultFoodBank(): DayFoodBank {
  return {
    proteines: 2, feculent: 3, legumes: 2, fruits: 2, laitiers: 1, graisses: 2, whey: 1,
    selectedProteines: 'volaille',
    selectedFeculent:  'riz',
    selectedLegumes:   'legumes_verts',
    selectedFruits:    'pomme',
    selectedLaitiers:  'fromage_blanc',
    selectedGraisses:  'huile_olive',
    selectedWhey:      'whey_std',
  };
}

export function emptyFoodBank(): DayFoodBank {
  return {
    proteines: 0, feculent: 0, legumes: 0, fruits: 0, laitiers: 0, graisses: 0, whey: 0,
    selectedProteines: 'volaille',
    selectedFeculent:  'riz',
    selectedLegumes:   'legumes_verts',
    selectedFruits:    'pomme',
    selectedLaitiers:  'fromage_blanc',
    selectedGraisses:  'huile_olive',
    selectedWhey:      'whey_std',
  };
}

// ─── Helper: selected food item ───────────────────────────────────────────────
export function getFoodItem(category: FoodCategory, id: string): FoodItem | undefined {
  return FOOD_ITEMS[category].find(f => f.id === id);
}

export function getSelectedItem(bank: DayFoodBank, cat: FoodCategory): FoodItem | undefined {
  const key = `selected${cat.charAt(0).toUpperCase() + cat.slice(1)}` as keyof DayFoodBank;
  return getFoodItem(cat, bank[key] as string);
}

// ─── Compute totals using PORTION_AVERAGES (single source of truth) ───────────
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

// Compute totals for one meal slot using PORTION_AVERAGES (consistent with bank)
export function computeMealTotals(portions: MealSlotPortion[]): BankTotals {
  let p = 0, g = 0, l = 0, k = 0;
  for (const pt of portions) {
    const avg = PORTION_AVERAGES[pt.category];
    p += avg.p * pt.portions;
    g += avg.g * pt.portions;
    l += avg.l * pt.portions;
    k += avg.kcal * pt.portions;
  }
  return { proteines: Math.round(p), glucides: Math.round(g), lipides: Math.round(l), kcal: Math.round(k) };
}

export function isBankEmpty(bank: DayFoodBank): boolean {
  return FOOD_CATEGORIES.every(cat => (bank[cat as keyof DayFoodBank] as number) === 0);
}

export function areMealsEmpty(meals: Record<MealSlot, MealSlotData>): boolean {
  return MEAL_SLOTS.every(s => meals[s].portions.length === 0);
}

// ─── Default empty meals ──────────────────────────────────────────────────────
export function defaultMealSlot(slot: string): MealSlotData {
  return { slot: slot as MealSlot, portions: [], customNotes: '' };
}

export function defaultMeals(): Record<MealSlot, MealSlotData> {
  return Object.fromEntries(
    MEAL_SLOTS.map(s => [s, defaultMealSlot(s)])
  ) as Record<MealSlot, MealSlotData>;
}

// ─── Half-portion distribution with controlled remainder ─────────────────────
// Guarantees: sum(result) === total, precision = 0.5 portions.
// Works in units of 0.5 (half-portions) internally.
function distributeCategory(total: number, weights: number[]): number[] {
  if (total <= 0) return weights.map(() => 0);

  // Work in half-portions to avoid decimal rounding drift
  const halfTotal = Math.round(total * 2);
  const rawHalves = weights.map(w => w * halfTotal);
  const floors = rawHalves.map(h => Math.floor(h));
  const fracs  = rawHalves.map((h, i) => h - floors[i]);

  const assigned  = floors.reduce((s, v) => s + v, 0);
  let remainder = halfTotal - assigned;

  // Assign remaining half-portions to slots with highest fractional part
  if (remainder > 0) {
    const order = fracs
      .map((f, i) => ({ i, f }))
      .sort((a, b) => b.f - a.f);
    for (let k = 0; k < remainder; k++) {
      floors[order[k % order.length].i]++;
    }
  }

  return floors.map(h => h / 2); // convert back to portions
}

// ─── Per-category weights for each distribution mode ─────────────────────────
// Slots: [Déjeuner(7h), CollAM(10h), Dîner(12h), CollPM(15h), Souper(18h), CollSoir(21h)]
//        idx:         [    0,            1,          2,           3,           4,          5 ]

// "Classique" weights — each category has its own distribution pattern
const CLASSIQUE_WEIGHTS: Record<FoodCategory, number[]> = {
  //              Déj    CollAM  Dîner  CollPM  Souper  CollS
  proteines: [0.15,  0.10,   0.25,  0.10,   0.30,   0.10],
  feculent:  [0.30,  0.05,   0.25,  0.10,   0.25,   0.05],
  legumes:   [0.00,  0.05,   0.40,  0.05,   0.45,   0.05],
  fruits:    [0.30,  0.20,   0.00,  0.30,   0.15,   0.05],
  laitiers:  [0.40,  0.20,   0.05,  0.25,   0.05,   0.05],
  graisses:  [0.10,  0.05,   0.35,  0.10,   0.35,   0.05],
  whey:      [0.00,  0.20,   0.00,  0.80,   0.00,   0.00],
};

// "Équilibrée" weights — equal 1/6 each
const EQUILIBREE_WEIGHTS: number[] = [1/6, 1/6, 1/6, 1/6, 1/6, 1/6];

// ─── Distribution result map ─────────────────────────────────────────────────
export type PortionMap = Partial<Record<MealSlot, Partial<Record<FoodCategory, number>>>>;

function buildPortionMap(bank: DayFoodBank, weightsByCat: Record<FoodCategory, number[]>): PortionMap {
  const result: PortionMap = {};
  for (const slot of MEAL_SLOTS) result[slot] = {};

  for (const cat of FOOD_CATEGORIES) {
    const total = bank[cat as keyof DayFoodBank] as number;
    if (!total) continue;
    const allocated = distributeCategory(total, weightsByCat[cat]);
    allocated.forEach((qty, i) => {
      if (qty > 0) result[MEAL_SLOTS[i]]![cat as FoodCategory] = qty;
    });
  }
  return result;
}

// ─── Classique distribution ───────────────────────────────────────────────────
export function distributeClassique(bank: DayFoodBank): PortionMap {
  return buildPortionMap(bank, CLASSIQUE_WEIGHTS);
}

// ─── Équilibrée distribution ──────────────────────────────────────────────────
export function distributeEquilibree(bank: DayFoodBank): PortionMap {
  const eq: Record<FoodCategory, number[]> = {} as Record<FoodCategory, number[]>;
  for (const cat of FOOD_CATEGORIES) eq[cat] = EQUILIBREE_WEIGHTS;
  return buildPortionMap(bank, eq);
}

// ─── Performance distribution (training-time-aware) ──────────────────────────
// Determines pre/post workout meal slots from training time (HH:MM).
// Pre-workout: moderate carbs, low fat, some protein.
// Post-workout: high protein (+ whey), moderate carbs, low fat.
export function distributePerformance(bank: DayFoodBank, heureEntrainement?: string): PortionMap {
  // Parse training time
  let trainH = 12.0; // default: noon
  if (heureEntrainement) {
    const [h, m] = heureEntrainement.split(':').map(Number);
    if (!isNaN(h)) trainH = h + (m || 0) / 60;
  }

  // Find pre-workout slot: last slot that starts before training time
  let preIdx = -1;
  let postIdx = -1;
  const hours = MEAL_SLOTS.map(s => MEAL_SLOT_HOURS[s as MealSlot]);

  for (let i = hours.length - 1; i >= 0; i--) {
    if (hours[i] < trainH - 0.5) { preIdx = i; break; }
  }
  for (let i = 0; i < hours.length; i++) {
    if (hours[i] > trainH) { postIdx = i; break; }
  }

  // Fallback for very early or very late training
  if (preIdx  < 0) preIdx  = 0;
  if (postIdx < 0) postIdx = hours.length - 1;
  if (postIdx === preIdx) postIdx = Math.min(preIdx + 1, hours.length - 1);

  // Build per-category weights adjusted for pre/post
  const weightsByCat: Record<FoodCategory, number[]> = {} as Record<FoodCategory, number[]>;

  for (const cat of FOOD_CATEGORIES) {
    // Start from classique weights as base
    const base = [...CLASSIQUE_WEIGHTS[cat]];

    if (cat === 'whey') {
      // Whey goes 100% to post-workout
      const w = base.map(() => 0);
      w[postIdx] = 1.0;
      weightsByCat[cat] = w;
      continue;
    }

    if (cat === 'proteines') {
      // Protein: extra weight to post-workout (+15%)
      base[postIdx] = Math.min(1, base[postIdx] + 0.15);
      base[preIdx]  = Math.max(0, base[preIdx]  - 0.05);
    }
    if (cat === 'feculent') {
      // Carbs: extra weight to pre-workout (+20%), reduce post
      base[preIdx]  = Math.min(1, base[preIdx]  + 0.20);
      base[postIdx] = Math.max(0, base[postIdx] - 0.10);
    }
    if (cat === 'graisses') {
      // Fat: reduce peri-workout (pre + post), redistribute to other meals
      base[preIdx]  = Math.max(0, base[preIdx]  - 0.08);
      base[postIdx] = Math.max(0, base[postIdx] - 0.08);
    }

    // Normalize to sum = 1
    const sum = base.reduce((s, v) => s + v, 0);
    weightsByCat[cat] = sum > 0 ? base.map(v => v / sum) : base;
  }

  return buildPortionMap(bank, weightsByCat);
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
