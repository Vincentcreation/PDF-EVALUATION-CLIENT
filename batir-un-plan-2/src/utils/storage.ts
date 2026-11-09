import type { Profile, NutritionalPlan } from '../types';

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

interface ImportResult {
  profiles: number;
  plans: number;
  warnings: string[];
}

export function importAllData(json: string): ImportResult {
  const data = JSON.parse(json);
  const warnings: string[] = [];

  // Version compat
  if (data.version && !['1.0', '2.0', '2.1'].includes(data.version)) {
    warnings.push(`Version de fichier inconnue: ${data.version} — importation tentée`);
  }

  const incomingProfiles: Profile[] = data.profiles ?? [];
  const incomingPlans: NutritionalPlan[] = data.plans ?? [];

  // Validate profiles
  const validProfiles = incomingProfiles.filter(p => {
    if (!p.id || !p.nom) {
      warnings.push(`Profil ignoré (données invalides): ${JSON.stringify(p).slice(0, 60)}`);
      return false;
    }
    return true;
  });

  // Validate plans
  const validPlans = incomingPlans.filter(p => {
    if (!p.id || !p.profileId) {
      warnings.push(`Plan ignoré (données invalides): ${JSON.stringify(p).slice(0, 60)}`);
      return false;
    }
    return true;
  });

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

  return { profiles: validProfiles.length, plans: validPlans.length, warnings };
}
