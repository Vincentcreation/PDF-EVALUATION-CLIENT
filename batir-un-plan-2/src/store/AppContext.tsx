import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Profile, NutritionalPlan, DayType } from '../types';
import {
  getProfiles, saveProfile, deleteProfile, getActiveProfileId, setActiveProfileId,
  getPlans, savePlan, deletePlan, getActivePlanId, setActivePlanId,
} from '../utils/storage';

type Page = 'profil' | 'dashboard' | 'planificateur' | 'macros' | 'recap';

interface AppCtx {
  page: Page;
  setPage: (p: Page) => void;
  activeDay: DayType;
  setActiveDay: (d: DayType) => void;
  profiles: Profile[];
  activeProfileId: string | null;
  activeProfile: Profile | null;
  plans: NutritionalPlan[];
  activePlanId: string | null;
  activePlan: NutritionalPlan | null;
  saveProfileAndSelect: (p: Profile) => void;
  removeProfile: (id: string) => void;
  selectProfile: (id: string) => void;
  savePlanAndSelect: (p: NutritionalPlan) => void;
  removePlan: (id: string) => void;
  selectPlan: (id: string) => void;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('profil');
  const [activeDay, setActiveDay] = useState<DayType>('entrainement');
  const [profiles, setProfiles] = useState<Profile[]>(() => getProfiles());
  const [activeProfileId, setAPId] = useState<string | null>(() => getActiveProfileId());
  const [plans, setPlans] = useState<NutritionalPlan[]>(() => getPlans());
  const [activePlanId, setAPlanId] = useState<string | null>(() => getActivePlanId());

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;
  const activePlan    = plans.find(p => p.id === activePlanId) ?? null;

  const saveProfileAndSelect = useCallback((profile: Profile) => {
    saveProfile(profile);
    setProfiles(getProfiles());
    setAPId(profile.id);
    setActiveProfileId(profile.id);
  }, []);

  const removeProfile = useCallback((id: string) => {
    deleteProfile(id);
    const rem = getProfiles();
    setProfiles(rem);
    if (activeProfileId === id) {
      const next = rem[0]?.id ?? null;
      setAPId(next);
      setActiveProfileId(next);
    }
  }, [activeProfileId]);

  const selectProfile = useCallback((id: string) => {
    setAPId(id);
    setActiveProfileId(id);
  }, []);

  const savePlanAndSelect = useCallback((plan: NutritionalPlan) => {
    savePlan(plan);
    setPlans(getPlans());
    setAPlanId(plan.id);
    setActivePlanId(plan.id);
  }, []);

  const removePlan = useCallback((id: string) => {
    deletePlan(id);
    const rem = getPlans();
    setPlans(rem);
    if (activePlanId === id) {
      const next = rem[0]?.id ?? null;
      setAPlanId(next);
      setActivePlanId(next);
    }
  }, [activePlanId]);

  const selectPlan = useCallback((id: string) => {
    setAPlanId(id);
    setActivePlanId(id);
  }, []);

  return (
    <AppContext.Provider value={{
      page, setPage,
      activeDay, setActiveDay,
      profiles, activeProfileId, activeProfile,
      plans, activePlanId, activePlan,
      saveProfileAndSelect, removeProfile, selectProfile,
      savePlanAndSelect, removePlan, selectPlan,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
