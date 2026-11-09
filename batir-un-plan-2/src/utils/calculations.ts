import type {
  Profile,
  NutritionalTargets,
  MacroDistribution,
  DayPlan,
  DayTotals,
  ActivityLevel,
  GoalType,
} from '../types';

// Activity level multipliers (Mifflin-St Jeor)
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaire: 'Sédentaire (peu ou pas d\'exercice)',
  leger: 'Légèrement actif (1-3j/sem)',
  modere: 'Modérément actif (3-5j/sem)',
  actif: 'Très actif (6-7j/sem)',
  tres_actif: 'Extrêmement actif (2x/jour)',
};

// Convert lbs to kg
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

// Convert kg to lbs
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

// Convert ft+in to cm
export function ftInToCm(feet: number, inches: number): number {
  return (feet * 30.48) + (inches * 2.54);
}

// Convert cm to ft+in
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

// Get weight in kg regardless of stored unit
export function getWeightKg(profile: Profile): number {
  if (profile.unitePoids === 'kg') return profile.poids;
  return lbsToKg(profile.poids);
}

// Get height in cm regardless of stored unit
export function getHeightCm(profile: Profile): number {
  if (profile.uniteHauteur === 'cm') return profile.taille;
  return ftInToCm(profile.taillepieds, profile.taillePouces);
}

// Mifflin-St Jeor BMR formula
export function calculateBMR(profile: Profile): number {
  const weightKg = getWeightKg(profile);
  const heightCm = getHeightCm(profile);
  const age = profile.age;

  if (profile.sexe === 'homme') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
}

// TDEE = BMR × activity multiplier
export function calculateTDEE(profile: Profile): number {
  const bmr = calculateBMR(profile);
  return bmr * ACTIVITY_MULTIPLIERS[profile.niveauActivite];
}

// Caloric targets
export function calculateTargets(profile: Profile, macros: MacroDistribution, goalType: GoalType, customKcal?: number): NutritionalTargets {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);

  const deficit = Math.round(tdee - 500);
  const maintien = Math.round(tdee);
  const surplus = Math.round(tdee + 500);

  let targetKcal: number;
  if (customKcal !== undefined && customKcal > 0) {
    targetKcal = customKcal;
  } else {
    switch (goalType) {
      case 'deficit': targetKcal = deficit; break;
      case 'surplus': targetKcal = surplus; break;
      default: targetKcal = maintien;
    }
  }

  // Macros from % distribution
  const proteinesG = Math.round((targetKcal * macros.proteines / 100) / 4);
  const glucidesG = Math.round((targetKcal * macros.glucides / 100) / 4);
  const lipidesG = Math.round((targetKcal * macros.lipides / 100) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    deficit,
    maintien,
    surplus,
    targetKcal,
    proteinesG,
    glucidesG,
    lipidesG,
  };
}

// Auto-calculate kcal from macros (4-4-9 rule)
export function calculateMealKcal(proteines: number, glucides: number, lipides: number): number {
  return Math.round(proteines * 4 + glucides * 4 + lipides * 9);
}

// Day totals
export function calculateDayTotals(day: DayPlan): DayTotals {
  return day.repas.reduce(
    (acc, repas) => ({
      proteines: acc.proteines + (repas.proteines || 0),
      glucides: acc.glucides + (repas.glucides || 0),
      lipides: acc.lipides + (repas.lipides || 0),
      kcal: acc.kcal + (repas.manualKcal ? repas.kcal : calculateMealKcal(repas.proteines, repas.glucides, repas.lipides)),
    }),
    { proteines: 0, glucides: 0, lipides: 0, kcal: 0 }
  );
}

export type MacroPresetKey = 'equilibre' | 'lowcarb' | 'highprotein' | 'cetogene' | 'custom';

export interface MacroPreset {
  label: string;
  proteines: number;
  glucides: number;
  lipides: number;
}

export const MACRO_PRESETS: Record<MacroPresetKey, MacroPreset> = {
  equilibre: { label: 'Équilibré', proteines: 30, glucides: 40, lipides: 30 },
  lowcarb: { label: 'Low Carb', proteines: 35, glucides: 25, lipides: 40 },
  highprotein: { label: 'High Protein', proteines: 40, glucides: 35, lipides: 25 },
  cetogene: { label: 'Cétogène', proteines: 25, glucides: 5, lipides: 70 },
  custom: { label: 'Personnalisé', proteines: 30, glucides: 40, lipides: 30 },
};

// Plan status evaluation
export function evaluatePlanStatus(actual: DayTotals, targets: NutritionalTargets): 'ok' | 'warn' | 'error' {
  const kcalDiff = Math.abs(actual.kcal - targets.targetKcal);
  const kcalPct = kcalDiff / targets.targetKcal;

  if (kcalPct > 0.15) return 'error';
  if (kcalPct > 0.08) return 'warn';
  return 'ok';
}
