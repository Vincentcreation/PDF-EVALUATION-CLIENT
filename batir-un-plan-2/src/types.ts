export type Sex = 'homme' | 'femme';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft';
export type ActivityLevel = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres_actif';
export type GoalType = 'deficit' | 'maintien' | 'surplus';
export type DayType = 'entrainement' | 'repos';
export type MealTiming = 'pre' | 'post' | 'normal';
export type PlanStatus = 'ok' | 'warn' | 'error';

export interface Profile {
  id: string;
  nom: string;
  sexe: Sex;
  age: number;
  poids: number;
  unitePoids: WeightUnit;
  taille: number;
  uniteHauteur: HeightUnit;
  taillepieds: number; // feet part when ft/in
  taillePouces: number; // inches part when ft/in
  niveauActivite: ActivityLevel;
  createdAt: string;
  updatedAt: string;
}

export interface MacroDistribution {
  proteines: number; // %
  glucides: number;  // %
  lipides: number;   // %
}

export interface MealEntry {
  id: string;
  nom: string;
  timing: MealTiming;
  proteines: number; // g
  glucides: number;  // g
  lipides: number;   // g
  kcal: number;      // auto or override
  manualKcal: boolean;
}

export interface DayPlan {
  type: DayType;
  repas: MealEntry[];
  notes: string;
}

export interface NutritionalPlan {
  id: string;
  nom: string;
  profileId: string;
  goalType: GoalType;
  customKcal?: number;
  macroPreset: string;
  macroDistribution: MacroDistribution;
  joursEntrainement: DayPlan;
  joursRepos: DayPlan;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionalTargets {
  bmr: number;
  tdee: number;
  deficit: number;
  maintien: number;
  surplus: number;
  targetKcal: number;
  proteinesG: number;
  glucidesG: number;
  lipidesG: number;
}

export interface DayTotals {
  proteines: number;
  glucides: number;
  lipides: number;
  kcal: number;
}
