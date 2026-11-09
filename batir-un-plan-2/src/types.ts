// ─── Enums & Literals ─────────────────────────────────────────────────────────

export type Sex = 'homme' | 'femme';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft';

export type ActivityLevel =
  | 'sedentaire'
  | 'leger'
  | 'modere'
  | 'actif'
  | 'tres_actif';

/** 5 caloric goals expressed as TDEE multipliers */
export type GoalType =
  | 'deficit20'   // TDEE × 0.80
  | 'deficit10'   // TDEE × 0.90
  | 'maintien'    // TDEE × 1.00
  | 'surplus10'   // TDEE × 1.10
  | 'surplus20';  // TDEE × 1.20

/** How the protein target is set */
export type ProteinMode = 'gkg' | 'pct';

/** 6 fixed meal slots */
export type MealSlot =
  | 'petitDejeuner'
  | 'collationMatin'
  | 'dejeuner'
  | 'collationAprem'
  | 'diner'
  | 'collationSoir';

/** Day type */
export type DayType = 'entrainement' | 'repos';

/** Macro preset keys — 8 presets + custom (matches original HTML) */
export type MacroPresetKey =
  | 'perteLegere'
  | 'perteSevere'
  | 'maintienP'
  | 'equilibreP'
  | 'priseLegere'
  | 'priseSevere'
  | 'performanceP'
  | 'lipidesReduits'
  | 'custom';

/** Food bank category */
export type FoodCategory =
  | 'proteines'
  | 'feculent'
  | 'legumes'
  | 'fruits'
  | 'laitiers'
  | 'graisses'
  | 'whey';

/** Automatic distribution mode */
export type DistributionMode = 'classique' | 'performance' | 'equilibree';

/** Plan validation status */
export type PlanStatus = 'ok' | 'warn' | 'error';

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  nom: string;
  sexe: Sex;
  age: number;
  poids: number;
  unitePoids: WeightUnit;
  taille: number;
  uniteHauteur: HeightUnit;
  taillepieds: number;   // feet component when ft
  taillePouces: number;  // inches component when ft
  niveauActivite: ActivityLevel;
  createdAt: string;
  updatedAt: string;
}

// ─── Macro Distribution ───────────────────────────────────────────────────────

export interface MacroDistribution {
  proteines: number; // %
  glucides: number;  // %
  lipides: number;   // %
}

// ─── Food Bank ────────────────────────────────────────────────────────────────

/** One food item option in a category */
export interface FoodItem {
  id: string;
  nom: string;
  poidsG: number;    // grams per portion
  proteines: number; // g per portion
  glucides: number;  // g per portion
  lipides: number;   // g per portion
  kcal: number;      // kcal per portion
}

/** Daily bank: how many portions of each food per day */
export interface DayFoodBank {
  // number of portions per category per day
  proteines: number;
  feculent: number;
  legumes: number;
  fruits: number;
  laitiers: number;
  graisses: number;
  whey: number;
  // selected food items per category (food item id)
  selectedProteines: string;
  selectedFeculent: string;
  selectedLegumes: string;
  selectedFruits: string;
  selectedLaitiers: string;
  selectedGraisses: string;
  selectedWhey: string;
}

// ─── Meal Slot ────────────────────────────────────────────────────────────────

/** Portion of a food bank category assigned to a meal */
export interface MealSlotPortion {
  category: FoodCategory;
  portions: number;
}

/** Contents of one meal slot */
export interface MealSlotData {
  slot: MealSlot;
  portions: MealSlotPortion[];
  customNotes: string;
}

// ─── Day Plan ─────────────────────────────────────────────────────────────────

export interface DayPlan {
  type: DayType;
  foodBank: DayFoodBank;
  meals: Record<MealSlot, MealSlotData>;
  distributionMode: DistributionMode;
  heureEntrainement: string; // HH:MM, for training day only
  notes: string;
  hydratation: {
    base: number;        // ml (auto-calculated)
    manuel: number;      // ml (user addition)
    total: number;       // ml (base + manuel)
  };
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

export interface NutritionalPlan {
  id: string;
  nom: string;
  profileId: string;
  goalType: GoalType;
  customKcal?: number;
  proteinMode: ProteinMode;
  proteinGkg: number;   // g/kg (when mode = gkg)
  macroPreset: MacroPresetKey;
  macroDistribution: MacroDistribution;
  joursEntrainement: DayPlan;
  joursRepos: DayPlan;
  createdAt: string;
  updatedAt: string;
}

// ─── Computed Targets ─────────────────────────────────────────────────────────

export interface NutritionalTargets {
  bmr: number;
  tdee: number;
  targetKcal: number;
  proteinesG: number;
  glucidesG: number;
  lipidesG: number;
}

export interface DayNutritionTotals {
  proteines: number;
  glucides: number;
  lipides: number;
  kcal: number;
  hydratation: number; // ml
}
