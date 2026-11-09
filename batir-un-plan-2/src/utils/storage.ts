import type { Profile, NutritionalPlan, MealSlot, MealSlotData } from '../types';

const PROFILES_KEY = 'elevate_profiles';
const PLANS_KEY    = 'elevate_plans';
const ACTIVE_PROFILE_KEY = 'elevate_active_profile';
const ACTIVE_PLAN_KEY    = 'elevate_active_plan';

// ─── Profiles ─────────────────────────────────────────────────────────────────

export function getProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY) ?? localStorage.getItem('batir_profiles');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProfile(profile: Profile): void {
  const list = getProfiles();
  const idx = list.findIndex(p => p.id === profile.id);
  if (idx >= 0) list[idx] = profile; else list.push(profile);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

export function deleteProfile(id: string): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(getProfiles().filter(p => p.id !== id)));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY) ?? localStorage.getItem('batir_active_profile');
}
export function setActiveProfileId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  else localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export function getPlans(): NutritionalPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY) ?? localStorage.getItem('batir_plans');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function savePlan(plan: NutritionalPlan): void {
  const list = getPlans();
  const idx = list.findIndex(p => p.id === plan.id);
  if (idx >= 0) list[idx] = plan; else list.push(plan);
  localStorage.setItem(PLANS_KEY, JSON.stringify(list));
}

export function deletePlan(id: string): void {
  localStorage.setItem(PLANS_KEY, JSON.stringify(getPlans().filter(p => p.id !== id)));
}

export function getActivePlanId(): string | null {
  return localStorage.getItem(ACTIVE_PLAN_KEY) ?? localStorage.getItem('batir_active_plan');
}
export function setActivePlanId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_PLAN_KEY, id);
  else localStorage.removeItem(ACTIVE_PLAN_KEY);
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export function exportAllData(): string {
  return JSON.stringify({
    version: '2.1',
    app: 'elevate-fitness-batir-un-plan',
    exportedAt: new Date().toISOString(),
    profiles: getProfiles(),
    plans: getPlans(),
  }, null, 2);
}

export interface ImportResult {
  profiles: number;
  plans: number;
  warnings: string[];
  errors: string[];
}

// ─── Converter: original HTML export format → current format ─────────────────
// The original HTML exports a single record with nom, sexe, poids, goalMultiplier, jours.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertLegacyRecord(rec: Record<string, any>): { profile: Profile; plan: NutritionalPlan } | null {
  try {
    const id = rec.id ?? `legacy-${Date.now()}`;
    const now = new Date().toISOString();

    // Map goalMultiplier → goalType
    const mult = rec.goalMultiplier ?? 1.0;
    const goalType = (
      mult <= 0.82 ? 'deficit20' :
      mult <= 0.95 ? 'deficit10' :
      mult <= 1.05 ? 'maintien'  :
      mult <= 1.15 ? 'surplus10' :
                     'surplus20'
    ) as Profile['niveauActivite'] extends string ? never : NutritionalPlan['goalType'];

    // Map niveauActivite string
    const actMap: Record<string, string> = {
      sedentaire: 'sedentaire', sedentary: 'sedentaire',
      leger: 'leger', light: 'leger',
      modere: 'modere', moderate: 'modere',
      actif: 'actif', active: 'actif',
      tres_actif: 'tres_actif', veryActive: 'tres_actif', very_active: 'tres_actif',
    };

    const profile: Profile = {
      id,
      nom: rec.nom ?? rec.name ?? 'Client importé',
      sexe: (rec.sexe ?? rec.sex ?? 'homme') as 'homme' | 'femme',
      age: rec.age ?? 30,
      poids: rec.poids ?? rec.weight ?? 70,
      unitePoids: (rec.unitePoids ?? 'kg') as 'kg' | 'lbs',
      taille: rec.taille ?? rec.height ?? 170,
      uniteHauteur: (rec.uniteHauteur ?? 'cm') as 'cm' | 'ft',
      taillepieds: rec.taillepieds ?? 0,
      taillePouces: rec.taillePouces ?? 0,
      niveauActivite: (actMap[rec.niveauActivite ?? rec.activityLevel ?? 'modere'] ?? 'modere') as Profile['niveauActivite'],
      createdAt: rec.createdAt ?? now,
      updatedAt: now,
    };

    // Convert food bank / jours from legacy format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function legacyFoodBank(raw: Record<string, any> | undefined) {
      if (!raw) return { proteines: 0, feculent: 0, legumes: 0, fruits: 0, laitiers: 0, graisses: 0, whey: 0,
        selectedProteines: 'volaille', selectedFeculent: 'riz', selectedLegumes: 'legumes_verts',
        selectedFruits: 'pomme', selectedLaitiers: 'fromage_blanc', selectedGraisses: 'huile_olive', selectedWhey: 'whey_std' };
      return {
        proteines: raw.proteines ?? raw.protein ?? 0,
        feculent: raw.feculent ?? raw.feculents ?? raw.glucides ?? 0,
        legumes: raw.legumes ?? raw.vegetables ?? 0,
        fruits: raw.fruits ?? 0,
        laitiers: raw.laitiers ?? raw.dairy ?? 0,
        graisses: raw.graisses ?? raw.fat ?? 0,
        whey: raw.whey ?? 0,
        selectedProteines: raw.selectedProteines ?? 'volaille',
        selectedFeculent: raw.selectedFeculent ?? 'riz',
        selectedLegumes: raw.selectedLegumes ?? 'legumes_verts',
        selectedFruits: raw.selectedFruits ?? 'pomme',
        selectedLaitiers: raw.selectedLaitiers ?? 'fromage_blanc',
        selectedGraisses: raw.selectedGraisses ?? 'huile_olive',
        selectedWhey: raw.selectedWhey ?? 'whey_std',
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function legacyMeals(_raw: Record<string, any> | undefined): Record<MealSlot, MealSlotData> {
      return {
        petitDejeuner:  { slot: 'petitDejeuner'  as MealSlot, portions: [], customNotes: '' },
        collationMatin: { slot: 'collationMatin' as MealSlot, portions: [], customNotes: '' },
        dejeuner:       { slot: 'dejeuner'       as MealSlot, portions: [], customNotes: '' },
        collationAprem: { slot: 'collationAprem' as MealSlot, portions: [], customNotes: '' },
        diner:          { slot: 'diner'          as MealSlot, portions: [], customNotes: '' },
        collationSoir:  { slot: 'collationSoir'  as MealSlot, portions: [], customNotes: '' },
      };
    }

    const jours = rec.jours ?? {};
    const entrDay = jours.entrainement ?? jours.training ?? {};
    const reposDay = jours.repos ?? jours.rest ?? {};

    const macroDistrib = rec.macroDistribution ?? { proteines: 25, glucides: 45, lipides: 30 };

    const plan: NutritionalPlan = {
      id: `plan-${id}`,
      nom: rec.planNom ?? rec.planName ?? `Plan importé — ${profile.nom}`,
      profileId: id,
      goalType,
      proteinMode: (rec.proteinMode ?? 'gkg') as 'gkg' | 'pct',
      proteinGkg: rec.proteinGkg ?? 2.0,
      macroPreset: (rec.macroPreset ?? 'maintienP') as NutritionalPlan['macroPreset'],
      macroDistribution: macroDistrib,
      joursEntrainement: {
        type: 'entrainement',
        foodBank: legacyFoodBank(entrDay.banque ?? entrDay.foodBank),
        meals: legacyMeals(entrDay.repas ?? entrDay.meals),
        distributionMode: (entrDay.distributionMode ?? 'classique') as 'classique' | 'performance' | 'equilibree',
        heureEntrainement: entrDay.heureEntrainement ?? '17:30',
        notes: entrDay.notes ?? '',
        hydratation: { base: 0, manuel: entrDay.hydratation?.manuel ?? 0, total: 0 },
      },
      joursRepos: {
        type: 'repos',
        foodBank: legacyFoodBank(reposDay.banque ?? reposDay.foodBank),
        meals: legacyMeals(reposDay.repas ?? reposDay.meals),
        distributionMode: (reposDay.distributionMode ?? 'classique') as 'classique' | 'performance' | 'equilibree',
        heureEntrainement: '',
        notes: reposDay.notes ?? '',
        hydratation: { base: 0, manuel: reposDay.hydratation?.manuel ?? 0, total: 0 },
      },
      createdAt: rec.createdAt ?? now,
      updatedAt: now,
    };

    return { profile, plan };
  } catch (e) {
    return null;
  }
}

export function importAllData(json: string): ImportResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let data: Record<string, unknown>;

  try {
    data = JSON.parse(json);
  } catch {
    errors.push('JSON invalide : impossible de parser le fichier.');
    return { profiles: 0, plans: 0, warnings, errors };
  }

  // Version compat
  if (data.version && !['1.0', '2.0', '2.1'].includes(String(data.version))) {
    warnings.push(`Version de fichier inconnue : ${data.version} — importation tentée.`);
  }

  let incomingProfiles: Profile[] = [];
  let incomingPlans: NutritionalPlan[] = [];

  // ── Detect old "single record" format ──────────────────────────────────────
  // Old format: { nom, sexe, poids, goalMultiplier, jours, ... }
  const isLegacyRecord = typeof data.nom === 'string' && !('profiles' in data);
  const isLegacyArray  = Array.isArray(data) && (data as unknown[]).every(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: unknown) => typeof r === 'object' && r !== null && 'nom' in (r as Record<string, unknown>) && !('profiles' in (r as Record<string, unknown>)),
  );

  if (isLegacyRecord || isLegacyArray) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: Record<string, any>[] = isLegacyArray ? (data as unknown as Record<string, any>[]) : [data as Record<string, any>];
    let converted = 0;
    for (const rec of records) {
      const result = convertLegacyRecord(rec);
      if (result) {
        incomingProfiles.push(result.profile);
        incomingPlans.push(result.plan);
        converted++;
      } else {
        warnings.push(`Enregistrement ignoré (conversion impossible) : ${JSON.stringify(rec).slice(0, 80)}`);
      }
    }
    if (converted === 0) {
      errors.push('Format ancien détecté mais aucun enregistrement n\'a pu être converti. Vérifiez la structure du fichier.');
      return { profiles: 0, plans: 0, warnings, errors };
    }
    warnings.push(`Format ancien converti (${converted} dossier${converted > 1 ? 's' : ''}).`);
  } else {
    // Current format: { profiles: [...], plans: [...] }
    if (!data.profiles && !data.plans) {
      errors.push('Format non reconnu : le fichier ne contient ni « profiles »/« plans » (format actuel) ni champs nom/jours (ancien format). Importation annulée.');
      return { profiles: 0, plans: 0, warnings, errors };
    }
    incomingProfiles = (data.profiles as Profile[]) ?? [];
    incomingPlans    = (data.plans as NutritionalPlan[]) ?? [];
  }

  // Validate profiles
  const validProfiles = incomingProfiles.filter(p => {
    if (!p.id || !p.nom) {
      warnings.push(`Profil ignoré (données invalides) : ${JSON.stringify(p).slice(0, 60)}`);
      return false;
    }
    return true;
  });

  // Validate plans
  const validPlans = incomingPlans.filter(p => {
    if (!p.id || !p.profileId) {
      warnings.push(`Plan ignoré (données invalides) : ${JSON.stringify(p).slice(0, 60)}`);
      return false;
    }
    return true;
  });

  if (validProfiles.length === 0 && validPlans.length === 0) {
    errors.push('Aucun profil ni plan valide trouvé dans le fichier. Importation annulée.');
    return { profiles: 0, plans: 0, warnings, errors };
  }

  // Merge (don't overwrite existing)
  const existing = getProfiles();
  validProfiles.forEach(p => {
    if (!existing.find(e => e.id === p.id)) existing.push(p);
  });
  localStorage.setItem(PROFILES_KEY, JSON.stringify(existing));

  const existingPlans = getPlans();
  validPlans.forEach(p => {
    if (!existingPlans.find(e => e.id === p.id)) existingPlans.push(p);
  });
  localStorage.setItem(PLANS_KEY, JSON.stringify(existingPlans));

  return { profiles: validProfiles.length, plans: validPlans.length, warnings, errors };
}
