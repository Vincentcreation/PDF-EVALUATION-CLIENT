import type {
  Profile,
  NutritionalTargets,
  MacroDistribution,
  GoalType,
  ActivityLevel,
  MacroPresetKey,
  ProteinMode,
} from '../types';

// ─── Activity Multipliers (Harris-Benedict standard) ─────────────────────────
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire:   1.2,
  leger:        1.375,
  modere:       1.55,
  actif:        1.725,
  tres_actif:   1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaire:   'Sédentaire (peu ou pas d\'exercice)',
  leger:        'Légèrement actif (1-3j/sem)',
  modere:       'Modérément actif (3-5j/sem)',
  actif:        'Très actif (6-7j/sem)',
  tres_actif:   'Extrêmement actif (2×/jour)',
};

// ─── Goal Multipliers ─────────────────────────────────────────────────────────
export const GOAL_MULTIPLIERS: Record<GoalType, number> = {
  deficit20:  0.80,
  deficit10:  0.90,
  maintien:   1.00,
  surplus10:  1.10,
  surplus20:  1.20,
};

export const GOAL_LABELS: Record<GoalType, string> = {
  deficit20:  'Déficit −20 %',
  deficit10:  'Déficit −10 %',
  maintien:   'Maintien',
  surplus10:  'Surplus +10 %',
  surplus20:  'Surplus +20 %',
};

export const GOAL_COLORS: Record<GoalType, string> = {
  deficit20:  'from-red-600 to-orange-600',
  deficit10:  'from-orange-500 to-amber-500',
  maintien:   'from-sky-600 to-blue-600',
  surplus10:  'from-emerald-500 to-teal-500',
  surplus20:  'from-green-500 to-emerald-600',
};

// ─── Unit Conversions ─────────────────────────────────────────────────────────
export function lbsToKg(lbs: number): number { return lbs * 0.453592; }
export function kgToLbs(kg: number): number  { return kg  * 2.20462; }
export function ftInToCm(feet: number, inches: number): number {
  return (feet * 30.48) + (inches * 2.54);
}
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalIn = cm / 2.54;
  return { feet: Math.floor(totalIn / 12), inches: Math.round(totalIn % 12) };
}

export function getWeightKg(profile: Profile): number {
  return profile.unitePoids === 'kg' ? profile.poids : lbsToKg(profile.poids);
}
export function getHeightCm(profile: Profile): number {
  return profile.uniteHauteur === 'cm'
    ? profile.taille
    : ftInToCm(profile.taillepieds, profile.taillePouces);
}

// ─── Harris-Benedict (Roza & Shizgal 1984 revision) ─────────────────────────
// NOTE: original HTML formula not confirmed — using standard Harris-Benedict.
// Verify exact coefficients against source file.
export function calculateBMR(profile: Profile): number {
  const kg = getWeightKg(profile);
  const cm = getHeightCm(profile);
  const age = profile.age;
  if (profile.sexe === 'homme') {
    return 88.362 + (13.397 * kg) + (4.799 * cm) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * kg) + (3.098 * cm) - (4.330 * age);
  }
}

export function calculateTDEE(profile: Profile): number {
  return calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.niveauActivite];
}

// ─── Caloric target from goal ─────────────────────────────────────────────────
export function getTargetKcal(tdee: number, goal: GoalType, customKcal?: number): number {
  if (customKcal && customKcal > 0) return customKcal;
  return Math.round(tdee * GOAL_MULTIPLIERS[goal]);
}

// ─── Macro Targets ────────────────────────────────────────────────────────────
export function calculateTargets(
  profile: Profile,
  macros: MacroDistribution,
  goal: GoalType,
  proteinMode: ProteinMode,
  proteinGkg: number,
  customKcal?: number,
): NutritionalTargets {
  const bmr  = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const targetKcal = getTargetKcal(tdee, goal, customKcal);
  const weightKg = getWeightKg(profile);

  let proteinesG: number;
  let glucidesG: number;
  let lipidesG: number;

  if (proteinMode === 'gkg') {
    proteinesG = Math.round(proteinGkg * weightKg);
    // remaining calories split between glucides and lipides in proportion
    const proteineKcal = proteinesG * 4;
    const remaining = targetKcal - proteineKcal;
    const glucidePct = macros.glucides / (macros.glucides + macros.lipides);
    glucidesG = Math.round((remaining * glucidePct) / 4);
    lipidesG  = Math.round((remaining * (1 - glucidePct)) / 9);
  } else {
    proteinesG = Math.round((targetKcal * macros.proteines / 100) / 4);
    glucidesG  = Math.round((targetKcal * macros.glucides  / 100) / 4);
    lipidesG   = Math.round((targetKcal * macros.lipides   / 100) / 9);
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal,
    proteinesG,
    glucidesG,
    lipidesG,
  };
}

// ─── Auto kcal from macros (4-4-9 rule) ──────────────────────────────────────
export function macrosToKcal(p: number, g: number, l: number): number {
  return Math.round(p * 4 + g * 4 + l * 9);
}

// ─── Macro Presets ───────────────────────────────────────────────────────────
export interface MacroPreset {
  label: string;
  proteines: number; // %
  glucides: number;  // %
  lipides: number;   // %
}

// 8 presets + custom. NOTE: values are standard French sports nutrition presets.
// Verify exact percentages against source HTML if available.
export const MACRO_PRESETS: Record<MacroPresetKey, MacroPreset> = {
  equilibre:      { label: 'Équilibré',         proteines: 30, glucides: 40, lipides: 30 },
  deficit_std:    { label: 'Déficit standard',   proteines: 35, glucides: 35, lipides: 30 },
  lowcarb:        { label: 'Low Carb',           proteines: 35, glucides: 20, lipides: 45 },
  highprotein:    { label: 'High Protein',       proteines: 40, glucides: 35, lipides: 25 },
  prisedeMasse:   { label: 'Prise de masse',     proteines: 25, glucides: 50, lipides: 25 },
  cetogene:       { label: 'Cétogène',           proteines: 25, glucides:  5, lipides: 70 },
  endurance:      { label: 'Endurance',          proteines: 20, glucides: 60, lipides: 20 },
  force:          { label: 'Force',              proteines: 35, glucides: 40, lipides: 25 },
  custom:         { label: 'Personnalisé',       proteines: 30, glucides: 40, lipides: 30 },
};

// ─── Default protein g/kg by goal ────────────────────────────────────────────
export const DEFAULT_PROTEIN_GKG: Record<GoalType, number> = {
  deficit20:  2.2,
  deficit10:  2.0,
  maintien:   1.8,
  surplus10:  1.8,
  surplus20:  1.6,
};

// Protein g/kg limits
export const PROTEIN_GKG_MIN = 1.2;
export const PROTEIN_GKG_MAX = 3.0;

// ─── Carb Cycling ────────────────────────────────────────────────────────────
// Rest day: reduce carbs by ~25%, increase fats slightly to compensate.
// NOTE: exact ratio not confirmed — verify against source HTML.
export function applyRestDayMacros(trainingMacros: MacroDistribution): MacroDistribution {
  const carbReductionPct = 25;
  const newGlucides = Math.max(5, trainingMacros.glucides - carbReductionPct);
  const diff = trainingMacros.glucides - newGlucides;
  const newLipides = Math.min(70, trainingMacros.lipides + diff);
  const newProteines = 100 - newGlucides - newLipides;
  return { proteines: Math.max(5, newProteines), glucides: newGlucides, lipides: newLipides };
}

// ─── Hydration ────────────────────────────────────────────────────────────────
// Base: 35 ml/kg + training bonus.
// NOTE: exact formula not confirmed — verify against source HTML.
export function calculateBaseHydration(profile: Profile, isTrainingDay: boolean): number {
  const kg = getWeightKg(profile);
  const base = Math.round(kg * 35);  // 35 ml/kg
  const trainingBonus = isTrainingDay ? 500 : 0;
  return base + trainingBonus;
}

// ─── Plan validation ─────────────────────────────────────────────────────────
// NOTE: thresholds from description — verify against source HTML.
export function validatePlan(
  actualKcal: number,
  targetKcal: number,
  actualP: number, targetP: number,
  actualG: number, targetG: number,
  actualL: number, targetL: number,
): { status: PlanStatus; messages: string[] } {
  const messages: string[] = [];
  const kcalDiffPct = Math.abs(actualKcal - targetKcal) / targetKcal * 100;
  const pDiffPct    = targetP > 0 ? Math.abs(actualP - targetP) / targetP * 100 : 0;
  const gDiffPct    = targetG > 0 ? Math.abs(actualG - targetG) / targetG * 100 : 0;
  const lDiffPct    = targetL > 0 ? Math.abs(actualL - targetL) / targetL * 100 : 0;

  if (kcalDiffPct > 15) {
    messages.push(`Calories: écart de ${kcalDiffPct.toFixed(0)}% (cible ±10%)`);
  } else if (kcalDiffPct > 10) {
    messages.push(`Calories: légèrement hors cible (${kcalDiffPct.toFixed(0)}%)`);
  }
  if (pDiffPct > 15) messages.push(`Protéines: écart de ${pDiffPct.toFixed(0)}%`);
  if (gDiffPct > 15) messages.push(`Glucides: écart de ${gDiffPct.toFixed(0)}%`);
  if (lDiffPct > 15) messages.push(`Lipides: écart de ${lDiffPct.toFixed(0)}%`);

  const status: PlanStatus = kcalDiffPct > 15 || pDiffPct > 15 ? 'error'
    : kcalDiffPct > 10 ? 'warn'
    : 'ok';

  return { status, messages };
}

type PlanStatus = 'ok' | 'warn' | 'error';
