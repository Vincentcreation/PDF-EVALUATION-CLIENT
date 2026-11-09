import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Profile, NutritionalPlan, DayType } from '../types';
import {
  getProfiles, saveProfile, deleteProfile, getActiveProfileId, setActiveProfileId,
  getPlans, savePlan, deletePlan, getActivePlanId, setActivePlanId,
} from '../utils/storage';

type Page = 'profil' | 'dashboard' | 'planificateur' | 'macros' | 'recap';

interface AppState {
  page: Page;
  profiles: Profile[];
  activeProfileId: string | null;
  plans: NutritionalPlan[];
  activePlanId: string | null;
  activeDay: DayType;
}

interface AppActions {
  setPage: (p: Page) => void;
  setActiveDay: (d: DayType) => void;
  saveProfileAndSelect: (profile: Profile) => void;
  removeProfile: (id: string) => void;
  selectProfile: (id: string) => void;
  savePlanAndSelect: (plan: NutritionalPlan) => void;
  removePlan: (id: string) => void;
  selectPlan: (id: string) => void;
  refreshPlans: () => void;
}

type AppContextType = AppState & AppActions & {
  activeProfile: Profile | null;
  activePlan: NutritionalPlan | null;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('profil');
  const [activeDay, setActiveDay] = useState<DayType>('entrainement');
  const [profiles, setProfiles] = useState<Profile[]>(() => getProfiles());
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => getActiveProfileId());
  const [plans, setPlans] = useState<NutritionalPlan[]>(() => getPlans());
  const [activePlanId, setActivePlanIdState] = useState<string | null>(() => getActivePlanId());

  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null;
  const activePlan = plans.find(p => p.id === activePlanId) ?? null;

  const saveProfileAndSelect = useCallback((profile: Profile) => {
    saveProfile(profile);
    setProfiles(getProfiles());
    setActiveProfileIdState(profile.id);
    setActiveProfileId(profile.id);
  }, []);

  const removeProfile = useCallback((id: string) => {
    deleteProfile(id);
    const remaining = getProfiles();
    setProfiles(remaining);
    if (activeProfileId === id) {
      const next = remaining[0]?.id ?? null;
      setActiveProfileIdState(next);
      setActiveProfileId(next);
    }
  }, [activeProfileId]);

  const selectProfile = useCallback((id: string) => {
    setActiveProfileIdState(id);
    setActiveProfileId(id);
  }, []);

  const savePlanAndSelect = useCallback((plan: NutritionalPlan) => {
    savePlan(plan);
    setPlans(getPlans());
    setActivePlanIdState(plan.id);
    setActivePlanId(plan.id);
  }, []);

  const removePlan = useCallback((id: string) => {
    deletePlan(id);
    const remaining = getPlans();
    setPlans(remaining);
    if (activePlanId === id) {
      const next = remaining[0]?.id ?? null;
      setActivePlanIdState(next);
      setActivePlanId(next);
    }
  }, [activePlanId]);

  const selectPlan = useCallback((id: string) => {
    setActivePlanIdState(id);
    setActivePlanId(id);
  }, []);

  const refreshPlans = useCallback(() => {
    setPlans(getPlans());
  }, []);

  return (
    <AppContext.Provider value={{
      page, setPage,
      activeDay, setActiveDay,
      profiles, activeProfileId, activeProfile,
      plans, activePlanId, activePlan,
      saveProfileAndSelect, removeProfile, selectProfile,
      savePlanAndSelect, removePlan, selectPlan, refreshPlans,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
