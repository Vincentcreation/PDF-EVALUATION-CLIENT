import type { Profile, NutritionalPlan } from '../types';

const PROFILES_KEY = 'batir_profiles';
const PLANS_KEY = 'batir_plans';
const ACTIVE_PROFILE_KEY = 'batir_active_profile';
const ACTIVE_PLAN_KEY = 'batir_active_plan';

export function getProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProfile(profile: Profile): void {
  const profiles = getProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

export function getPlans(): NutritionalPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlan(plan: NutritionalPlan): void {
  const plans = getPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function deletePlan(id: string): void {
  const plans = getPlans().filter(p => p.id !== id);
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function getActivePlanId(): string | null {
  return localStorage.getItem(ACTIVE_PLAN_KEY);
}

export function setActivePlanId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PLAN_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PLAN_KEY);
  }
}

export function exportAllData(): string {
  const data = {
    profiles: getProfiles(),
    plans: getPlans(),
    exportedAt: new Date().toISOString(),
    version: '2.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): { profiles: number; plans: number } {
  const data = JSON.parse(json);
  const profiles: Profile[] = data.profiles || [];
  const plans: NutritionalPlan[] = data.plans || [];

  // Merge with existing
  const existingProfiles = getProfiles();
  const existingPlans = getPlans();

  profiles.forEach(p => {
    if (!existingProfiles.find(ep => ep.id === p.id)) {
      existingProfiles.push(p);
    }
  });

  plans.forEach(p => {
    if (!existingPlans.find(ep => ep.id === p.id)) {
      existingPlans.push(p);
    }
  });

  localStorage.setItem(PROFILES_KEY, JSON.stringify(existingProfiles));
  localStorage.setItem(PLANS_KEY, JSON.stringify(existingPlans));

  return { profiles: profiles.length, plans: plans.length };
}
