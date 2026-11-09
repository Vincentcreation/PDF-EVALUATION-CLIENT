import { useApp } from '../store/AppContext';
import {
  calculateTargets, calculateBMR, calculateTDEE,
  GOAL_LABELS, GOAL_MULTIPLIERS, GOAL_COLORS, MACRO_PRESETS,
  DEFAULT_PROTEIN_GKG,
} from '../utils/calculations';
import type { GoalType, NutritionalPlan, MacroPresetKey } from '../types';
import { v4 } from '../utils/uuid';
import { defaultFoodBank, defaultMeals, computeBankTotals } from '../utils/foodBank';
import { AlertCircle, TrendingDown, TrendingUp, Minus, Plus, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const { activeProfile, activePlan, savePlanAndSelect, plans, selectPlan, activeDay, removePlan } = useApp();

  if (!activeProfile) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle size={36} className="text-zinc-500 mb-3" />
      <p className="text-zinc-400">Aucun profil actif. Créez d'abord un profil dans <span className="text-gold">Profil Athlète</span>.</p>
    </div>
  );

  const bmr  = Math.round(calculateBMR(activeProfile));
  const tdee = Math.round(calculateTDEE(activeProfile));

  const goalType = activePlan?.goalType ?? 'maintien';
  const macroPreset = (activePlan?.macroPreset ?? 'equilibre') as MacroPresetKey;
  const macroDistrib = activePlan?.macroDistribution ?? MACRO_PRESETS[macroPreset];
  const proteinMode = activePlan?.proteinMode ?? 'pct';
  const proteinGkg  = activePlan?.proteinGkg  ?? DEFAULT_PROTEIN_GKG[goalType];
  const targets = calculateTargets(activeProfile, macroDistrib, goalType, proteinMode, proteinGkg, activePlan?.customKcal);

  const trainingTotals = activePlan ? computeBankTotals(activePlan.joursEntrainement.foodBank) : null;
  const reposTotals    = activePlan ? computeBankTotals(activePlan.joursRepos.foodBank)         : null;
  const dayTotals = activeDay === 'entrainement' ? trainingTotals : reposTotals;

  const profilePlans = plans.filter(p => p.profileId === activeProfile.id);

  function createPlan(goal: GoalType) {
    const macros = MACRO_PRESETS.equilibre;
    const newPlan: NutritionalPlan = {
      id: v4(),
      nom: `Plan ${GOAL_LABELS[goal]} — ${activeProfile!.nom}`,
      profileId: activeProfile!.id,
      goalType: goal,
      proteinMode: 'pct',
      proteinGkg: DEFAULT_PROTEIN_GKG[goal],
      macroPreset: 'equilibre',
      macroDistribution: macros,
      joursEntrainement: {
        type: 'entrainement',
        foodBank: defaultFoodBank(),
        meals: defaultMeals(),
        distributionMode: 'classique',
        heureEntrainement: '17:30',
        notes: '',
        hydratation: { base: 0, manuel: 0, total: 0 },
      },
      joursRepos: {
        type: 'repos',
        foodBank: { ...defaultFoodBank() },
        meals: defaultMeals(),
        distributionMode: 'classique',
        heureEntrainement: '',
        notes: '',
        hydratation: { base: 0, manuel: 0, total: 0 },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Set rest day macros (carb cycling)
    newPlan.joursRepos.foodBank.feculent = Math.max(1, newPlan.joursEntrainement.foodBank.feculent - 1);
    savePlanAndSelect(newPlan);
  }

  const goalOrder: GoalType[] = ['deficit20', 'deficit10', 'maintien', 'surplus10', 'surplus20'];
  const goalIcons: Record<GoalType, typeof TrendingDown> = {
    deficit20: TrendingDown, deficit10: TrendingDown,
    maintien: Minus,
    surplus10: TrendingUp, surplus20: TrendingUp,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Tableau de bord</h1>
        <p className="text-zinc-500 text-sm mt-1">Besoins nutritionnels de <span className="text-gold font-medium">{activeProfile.nom}</span></p>
      </div>

      {/* BMR / TDEE */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Métabolisme de base (BMR)" value={bmr} unit="kcal/j" note="Harris-Benedict" />
        <MetricCard label="Dépense totale (TDEE)" value={tdee} unit="kcal/j" note={`BMR × ${(GOAL_MULTIPLIERS[goalType]).toFixed(2)} × activité`} />
      </div>

      {/* 5 Goal Cards */}
      <div>
        <p className="section-title">Objectif calorique</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {goalOrder.map(g => {
            const Icon = goalIcons[g];
            const kcal = Math.round(tdee * GOAL_MULTIPLIERS[g]);
            const isActive = goalType === g;
            return (
              <button
                key={g}
                onClick={() => {
                  if (activePlan) {
                    savePlanAndSelect({ ...activePlan, goalType: g, updatedAt: new Date().toISOString() });
                  } else {
                    createPlan(g);
                  }
                }}
                className={`relative p-4 rounded-2xl border text-left transition-all ${
                  isActive
                    ? 'border-gold/60 bg-gold/5 shadow-gold'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${GOAL_COLORS[g]} flex items-center justify-center mb-3`}>
                  <Icon size={15} className="text-white" />
                </div>
                <p className="text-xs text-zinc-400 leading-tight">{GOAL_LABELS[g]}</p>
                <p className="text-xl font-bold text-zinc-100 mt-1">{kcal.toLocaleString('fr-CA')}</p>
                <p className="text-xs text-zinc-500">kcal/j</p>
                {isActive && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-gold" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Macro targets */}
      {activePlan && (
        <div>
          <p className="section-title">Objectifs macros</p>
          <div className="grid grid-cols-3 gap-4">
            <MacroCard label="Protéines" g={targets.proteinesG} pct={macroDistrib.proteines} dotColor="bg-sky-500" />
            <MacroCard label="Glucides"  g={targets.glucidesG}  pct={macroDistrib.glucides}  dotColor="bg-amber-500" />
            <MacroCard label="Lipides"   g={targets.lipidesG}   pct={macroDistrib.lipides}   dotColor="bg-rose-500" />
          </div>
        </div>
      )}

      {/* Plan status */}
      {activePlan && dayTotals && dayTotals.kcal > 0 && (
        <div>
          <p className="section-title">Statut du plan — {activeDay === 'entrainement' ? 'Entraînement' : 'Repos'}</p>
          <div className="card p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProgressBar label="Calories"  actual={dayTotals.kcal}      target={targets.targetKcal} unit="kcal" />
              <ProgressBar label="Protéines" actual={dayTotals.proteines} target={targets.proteinesG} unit="g"    color="bg-sky-500" />
              <ProgressBar label="Glucides"  actual={dayTotals.glucides}  target={targets.glucidesG}  unit="g"    color="bg-amber-500" />
              <ProgressBar label="Lipides"   actual={dayTotals.lipides}   target={targets.lipidesG}   unit="g"    color="bg-rose-500" />
            </div>
          </div>
        </div>
      )}

      {/* Plans list */}
      <div>
        <p className="section-title">Plans enregistrés</p>
        {profilePlans.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-zinc-800">
            <p className="text-zinc-500 mb-3 text-sm">Aucun plan. Sélectionnez un objectif ci-dessus pour créer votre premier plan.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profilePlans.map(p => (
              <div key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  activePlan?.id === p.id ? 'border-gold/50 bg-gold/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
                onClick={() => selectPlan(p.id)}
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">{p.nom}</p>
                  <p className="text-xs text-zinc-500">{GOAL_LABELS[p.goalType]} · créé {new Date(p.createdAt).toLocaleDateString('fr-CA')}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ce plan ?')) removePlan(p.id); }}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button onClick={() => createPlan('maintien')} className="flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors mt-2">
              <Plus size={13} /> Nouveau plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, note }: { label: string; value: number; unit: string; note: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-zinc-100">{value.toLocaleString('fr-CA')}</span>
        <span className="text-sm text-zinc-400">{unit}</span>
      </div>
      <p className="text-xs text-zinc-600 mt-1">{note}</p>
    </div>
  );
}

function MacroCard({ label, g, pct, dotColor }: { label: string; g: number; pct: number; dotColor: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-zinc-100">{g}</span>
        <span className="text-sm text-zinc-400">g</span>
      </div>
      <p className="text-xs text-zinc-600 mt-1">{pct}% des calories</p>
    </div>
  );
}

function ProgressBar({ label, actual, target, unit, color = 'bg-gold' }: {
  label: string; actual: number; target: number; unit: string; color?: string;
}) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const over = actual > target;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-300">{Math.round(actual)}/{target} {unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${over ? 'bg-red-500' : color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-xs mt-1 ${over ? 'text-red-400' : 'text-zinc-500'}`}>
        {over ? `+${Math.round(actual - target)}` : `−${Math.round(target - actual)}`} {unit}
      </p>
    </div>
  );
}
