import type {
  Profile,
  NutritionalTargets,
  MacroDistribution,
  GoalType,
  DayType,
  ActivityLevel,
  MacroPresetKey,
  ProteinMode,
} from '../types';

// ─── IOM/EER PA coefficients (sex-specific) ───────────────────────────────────
// Source: Institute of Medicine Estimated Energy Requirements
// 4 official levels + tres_actif extrapolated (not in original IOM table)
const PA_HOMME: Record<ActivityLevel, number> = {
  sedentaire: 1.00,
  leger:      1.11,
  modere:     1.25,
  actif:      1.48,
  tres_actif: 1.65,  // extrapolated — IOM has 4 levels only
};

const PA_FEMME: Record<ActivityLevel, number> = {
  sedentaire: 1.00,
  leger:      1.12,
  modere:     1.27,
  actif:      1.45,
  tres_actif: 1.60,  // extrapolated
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaire:   'Sédentaire (peu ou pas d\'exercice)',
  leger:        'Légèrement actif (1-3j/sem)',
  modere:       'Modérément actif (3-5j/sem)',
  actif:        'Très actif (6-7j/sem)',
  tres_actif:   'Extrêmement actif (2×/jour)',
};

// ─── Goal multipliers (TDEE × factor) ────────────────────────────────────────
export const GOAL_MULTIPLIERS: Record<GoalType, number> = {
  deficit20: 0.80,
  deficit10: 0.90,
  maintien:  1.00,
  surplus10: 1.10,
  surplus20: 1.20,
};

export const GOAL_LABELS: Record<GoalType, string> = {
  deficit20: 'Déficit −20 %',
  deficit10: 'Déficit −10 %',
  maintien:  'Maintien',
  surplus10: 'Surplus +10 %',
  surplus20: 'Surplus +20 %',
};

export const GOAL_COLORS: Record<GoalType, string> = {
  deficit20: 'from-red-600 to-orange-600',
  deficit10: 'from-orange-500 to-amber-500',
  maintien:  'from-sky-600 to-blue-600',
  surplus10: 'from-emerald-500 to-teal-500',
  surplus20: 'from-green-500 to-emerald-600',
};

// ─── Unit helpers ─────────────────────────────────────────────────────────────
export function lbsToKg(lbs: number): number { return lbs * 0.453592; }
export function kgToLbs(kg: number): number  { return kg  * 2.20462;  }
export function ftInToCm(feet: number, inches: number): number {
  return (feet * 30.48) + (inches * 2.54);
}
export function getWeightKg(profile: Profile): number {
  return profile.unitePoids === 'kg' ? profile.poids : lbsToKg(profile.poids);
}
export function getHeightCm(profile: Profile): number {
  return profile.uniteHauteur === 'cm'
    ? profile.taille
    : ftInToCm(profile.taillepieds, profile.taillePouces);
}

// ─── IOM/EER BMR (PA = 1.00 for sedentary reference) ────────────────────────
// Men:   662 - 9.53×age + 1.00×(15.91×kg + 539.6×m)
// Women: 354 - 6.91×age + 1.00×(9.36×kg  + 726×m)
export function calculateBMR(profile: Profile): number {
  const kg  = getWeightKg(profile);
  const m   = getHeightCm(profile) / 100;   // convert cm → metres
  const age = profile.age;
  if (profile.sexe === 'homme') {
    return 662 - (9.53 * age) + 1.00 * (15.91 * kg + 539.6 * m);
  } else {
    return 354 - (6.91 * age) + 1.00 * (9.36  * kg + 726   * m);
  }
}

// ─── IOM/EER TDEE (PA varies by sex + activity level) ────────────────────────
// Men:   662 - 9.53×age + PA×(15.91×kg + 539.6×m)
// Women: 354 - 6.91×age + PA×(9.36×kg  + 726×m)
export function calculateTDEE(profile: Profile): number {
  const kg  = getWeightKg(profile);
  const m   = getHeightCm(profile) / 100;
  const age = profile.age;
  const pa  = profile.sexe === 'homme'
    ? PA_HOMME[profile.niveauActivite]
    : PA_FEMME[profile.niveauActivite];
  if (profile.sexe === 'homme') {
    return 662 - (9.53 * age) + pa * (15.91 * kg + 539.6 * m);
  } else {
    return 354 - (6.91 * age) + pa * (9.36  * kg + 726   * m);
  }
}

// ─── Caloric target ───────────────────────────────────────────────────────────
export function getTargetKcal(tdee: number, goal: GoalType, customKcal?: number): number {
  if (customKcal && customKcal > 0) return customKcal;
  return Math.round(tdee * GOAL_MULTIPLIERS[goal]);
}

// ─── Macro Targets ────────────────────────────────────────────────────────────
// Protein is computed first (g/kg or %).
// Remaining calories are split between GLU and LIP proportionally to their
// preset ratio (preset P% is indicative only).
export function calculateTargets(
  profile: Profile,
  macros: MacroDistribution,
  goal: GoalType,
  proteinMode: ProteinMode,
  proteinGkg: number,
  customKcal?: number,
): NutritionalTargets {
  const bmr        = calculateBMR(profile);
  const tdee       = calculateTDEE(profile);
  const targetKcal = getTargetKcal(tdee, goal, customKcal);
  const weightKg   = getWeightKg(profile);

  let proteinesG: number;
  let glucidesG:  number;
  let lipidesG:   number;

  if (proteinMode === 'gkg') {
    proteinesG = Math.round(proteinGkg * weightKg);
  } else {
    // pct mode: macros.proteines % of total kcal
    proteinesG = Math.round((targetKcal * macros.proteines / 100) / 4);
  }

  // Remaining kcal after protein
  const proteineKcal = proteinesG * 4;
  const remaining    = Math.max(0, targetKcal - proteineKcal);

  // Split remaining between G and L using their preset ratio
  const gluRatio = macros.glucides / (macros.glucides + macros.lipides);
  glucidesG = Math.round((remaining * gluRatio) / 4);
  lipidesG  = Math.round((remaining * (1 - gluRatio)) / 9);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal,
    proteinesG,
    glucidesG,
    lipidesG,
  };
}

// ─── Auto kcal (4-4-9 rule) ───────────────────────────────────────────────────
export function macrosToKcal(p: number, g: number, l: number): number {
  return Math.round(p * 4 + g * 4 + l * 9);
}

// ─── 8 Macro Presets + Custom ────────────────────────────────────────────────
// P% is indicative — actual protein is computed separately.
// Only G:L ratio is used for splitting remaining calories.
export interface MacroPreset {
  label: string;
  proteines: number; // % (indicative)
  glucides:  number; // %
  lipides:   number; // %
}

export const MACRO_PRESETS: Record<MacroPresetKey, MacroPreset> = {
  perteLegere:    { label: 'Perte légère',     proteines: 30, glucides: 40, lipides: 30 },
  perteSevere:    { label: 'Perte sévère',     proteines: 40, glucides: 35, lipides: 25 },
  maintienP:      { label: 'Maintien',         proteines: 25, glucides: 45, lipides: 30 },
  equilibreP:     { label: 'Équilibré',        proteines: 33, glucides: 33, lipides: 33 }, // rounded from 33.3
  priseLegere:    { label: 'Prise légère',     proteines: 25, glucides: 50, lipides: 25 },
  priseSevere:    { label: 'Prise sévère',     proteines: 20, glucides: 55, lipides: 25 },
  performanceP:   { label: 'Performance',      proteines: 15, glucides: 60, lipides: 25 },
  lipidesReduits: { label: 'Lipides réduits',  proteines: 45, glucides: 35, lipides: 20 },
  custom:         { label: 'Personnalisé',     proteines: 25, glucides: 45, lipides: 30 },
};

// Default preset (Maintien)
export const DEFAULT_MACRO_PRESET: MacroPresetKey = 'maintienP';

// ─── Protein defaults ─────────────────────────────────────────────────────────
// g/kg mode: default 2.0, min 2.0, max 3.0
// pct mode:  default 25%, min 10%, max 50%
export const DEFAULT_PROTEIN_GKG  = 2.0;
export const PROTEIN_GKG_MIN      = 2.0;
export const PROTEIN_GKG_MAX      = 3.0;
export const DEFAULT_PROTEIN_PCT  = 25;
export const PROTEIN_PCT_MIN      = 10;
export const PROTEIN_PCT_MAX      = 50;

// ─── Carb cycling (rest day) ──────────────────────────────────────────────────
// gluPct × 0.75, lipPct × 1.15, then renormalize so G+L = (100 - P%).
export function applyRestDayMacros(training: MacroDistribution): MacroDistribution {
  const pPct = training.proteines;
  const rawG = training.glucides * 0.75;
  const rawL = training.lipides  * 1.15;
  const total = rawG + rawL;
  const nonP  = 100 - pPct;
  const gPct  = Math.round((rawG / total) * nonP);
  const lPct  = nonP - gPct;
  return { proteines: pPct, glucides: gPct, lipides: lPct };
}

// ─── Hydration (auto) ─────────────────────────────────────────────────────────
// auto = round(kcal / 1000 × 10) / 10  L  (1 L per 1000 kcal, 1-decimal precision)
// Returns ml.
export function calculateBaseHydration(targetKcal: number): number {
  const litres = Math.round(targetKcal / 1000 * 10) / 10;
  return Math.round(litres * 1000); // return ml
}

// ─── Day-specific targets (applies carb cycling for rest day) ─────────────────
export function calculateTargetsForDay(
  profile: Profile,
  macros: MacroDistribution,
  goal: GoalType,
  dayType: DayType,
  proteinMode: ProteinMode,
  proteinGkg: number,
  customKcal?: number,
): NutritionalTargets {
  const dayMacros = dayType === 'repos' ? applyRestDayMacros(macros) : macros;
  return calculateTargets(profile, dayMacros, goal, proteinMode, proteinGkg, customKcal);
}

// ─── Hydration from bank kcal ─────────────────────────────────────────────────
// When bank is non-empty use bank kcal; otherwise use target kcal.
export function calculateHydration(bankKcal: number, targetKcal: number, manuelMl: number): {
  base: number; total: number;
} {
  const refKcal = bankKcal > 0 ? bankKcal : targetKcal;
  const base = calculateBaseHydration(refKcal);
  return { base, total: base + manuelMl };
}

// ─── Auto-calculate bank from targets ─────────────────────────────────────────
// Greedy algorithm: protein → fat → starch, with fixed minimums for veg/fruit/dairy
export function autoCalculateBank(
  targets: NutritionalTargets,
): Record<string, number> {
  // These imports are inline to avoid circular dep
  const avg = {
    proteines: { p: 9,  g: 0,  l: 2  },
    feculent:  { p: 3,  g: 18, l: 1  },
    legumes:   { p: 2,  g: 7,  l: 0  },
    fruits:    { p: 1,  g: 15, l: 2  },
    laitiers:  { p: 7,  g: 10, l: 2  },
    graisses:  { p: 1,  g: 2,  l: 6  },
    whey:      { p: 22, g: 2,  l: 2  },
  };

  // Fixed minimums
  const r = { proteines: 0, feculent: 0, legumes: 2, fruits: 2, laitiers: 1, graisses: 0, whey: 0 };

  let remP = targets.proteinesG
    - avg.legumes.p * r.legumes - avg.fruits.p * r.fruits - avg.laitiers.p * r.laitiers;
  let remG = targets.glucidesG
    - avg.legumes.g * r.legumes - avg.fruits.g * r.fruits - avg.laitiers.g * r.laitiers;
  let remL = targets.lipidesG
    - avg.legumes.l * r.legumes - avg.fruits.l * r.fruits - avg.laitiers.l * r.laitiers;

  // Protein portions
  r.proteines = Math.max(1, Math.round(remP / avg.proteines.p));
  remP -= avg.proteines.p * r.proteines;
  remG -= avg.proteines.g * r.proteines;
  remL -= avg.proteines.l * r.proteines;

  // Fat portions
  r.graisses = Math.max(0, Math.round(remL / avg.graisses.l));
  remG -= avg.graisses.g * r.graisses;

  // Starch from remaining glucides
  r.feculent = Math.max(0, Math.round(remG / avg.feculent.g));

  return r;
}

// ─── Plan validation (absolute tolerances: 50 kcal, 5 g macros) ──────────────
type PlanStatus = 'ok' | 'warn' | 'error';

export interface ValidationResult {
  status: PlanStatus;
  messages: string[];
  bankEmpty: boolean;
  mealsEmpty: boolean;
}

export function validatePlan(
  actualKcal: number, targetKcal: number,
  actualP: number, targetP: number,
  actualG: number, targetG: number,
  actualL: number, targetL: number,
  bankEmpty?: boolean,
  mealsEmpty?: boolean,
): ValidationResult {
  const messages: string[] = [];

  if (bankEmpty) {
    messages.push('Banque d\'équivalents vide — entrez des portions pour chaque catégorie.');
    return { status: 'error', messages, bankEmpty: true, mealsEmpty: mealsEmpty ?? false };
  }

  const dK = Math.abs(actualKcal - targetKcal);
  const dP = Math.abs(actualP - targetP);
  const dG = Math.abs(actualG - targetG);
  const dL = Math.abs(actualL - targetL);

  if (dK > 100) messages.push(`Calories : écart de ${Math.round(dK)} kcal`);
  else if (dK > 50) messages.push(`Calories : légèrement hors cible (${Math.round(dK)} kcal)`);

  if (dP > 10)  messages.push(`Protéines : écart de ${Math.round(dP)} g`);
  else if (dP > 5) messages.push(`Protéines : légèrement hors cible (${Math.round(dP)} g)`);

  if (dG > 10)  messages.push(`Glucides : écart de ${Math.round(dG)} g`);
  else if (dG > 5) messages.push(`Glucides : légèrement hors cible (${Math.round(dG)} g)`);

  if (dL > 10)  messages.push(`Lipides : écart de ${Math.round(dL)} g`);
  else if (dL > 5) messages.push(`Lipides : légèrement hors cible (${Math.round(dL)} g)`);

  if (mealsEmpty) messages.push('Repas non distribués — utilisez la répartition automatique.');

  const status: PlanStatus =
    dK > 100 || dP > 10 ? 'error' :
    dK > 50  || dP > 5  ? 'warn'  : 'ok';

  return { status, messages, bankEmpty: false, mealsEmpty: mealsEmpty ?? false };
}
