import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { calculateTargets, calculateDayTotals, evaluatePlanStatus, MACRO_PRESETS } from '../utils/calculations';
import type { MacroPresetKey } from '../utils/calculations';
import type { NutritionalPlan, GoalType, MacroDistribution } from '../types';
import { v4 } from '../utils/uuid';
import { TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

const GOAL_LABELS: Record<GoalType, string> = {
  deficit: 'Déficit',
  maintien: 'Maintien',
  surplus: 'Surplus',
};

const GOAL_DESCS: Record<GoalType, string> = {
  deficit: 'Perte de poids (-500 kcal)',
  maintien: 'Maintien du poids actuel',
  surplus: 'Prise de masse (+500 kcal)',
};

export default function DashboardPage() {
  const { activeProfile, activePlan, savePlanAndSelect, plans, selectPlan, activeDay } = useApp();
  const [selectedGoal, setSelectedGoal] = useState<GoalType>(activePlan?.goalType ?? 'maintien');

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={36} className="text-slate-500 mb-3" />
        <p className="text-slate-400">Aucun profil actif. Créez d'abord un profil dans l'onglet <span className="text-sky-400">Profil Athlète</span>.</p>
      </div>
    );
  }

  const macroPreset = (activePlan?.macroPreset ?? 'equilibre') as MacroPresetKey;
  const macroDistrib: MacroDistribution = activePlan?.macroDistribution ?? MACRO_PRESETS[macroPreset];
  const targets = calculateTargets(activeProfile, macroDistrib, selectedGoal, activePlan?.customKcal);

  const dayPlan = activePlan ? (activeDay === 'entrainement' ? activePlan.joursEntrainement : activePlan.joursRepos) : null;
  const actuals = dayPlan ? calculateDayTotals(dayPlan) : null;
  const status = actuals ? evaluatePlanStatus(actuals, targets) : null;

  function createPlanForGoal(goal: GoalType) {
    const newPlan: NutritionalPlan = {
      id: v4(),
      nom: `Plan ${GOAL_LABELS[goal]} - ${activeProfile!.nom}`,
      profileId: activeProfile!.id,
      goalType: goal,
      macroPreset: 'equilibre',
      macroDistribution: MACRO_PRESETS.equilibre,
      joursEntrainement: { type: 'entrainement', repas: [], notes: '' },
      joursRepos: { type: 'repos', repas: [], notes: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    savePlanAndSelect(newPlan);
    setSelectedGoal(goal);
  }

  const goalCards = ([
    { type: 'deficit' as GoalType, icon: TrendingDown, color: 'from-orange-500 to-red-500', kcal: targets.deficit },
    { type: 'maintien' as GoalType, icon: Minus, color: 'from-sky-500 to-blue-600', kcal: targets.maintien },
    { type: 'surplus' as GoalType, icon: TrendingUp, color: 'from-emerald-500 to-green-600', kcal: targets.surplus },
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
        <p className="text-slate-400 text-sm mt-1">Aperçu des besoins nutritionnels pour <span className="text-sky-400">{activeProfile.nom}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Métabolisme de base (BMR)" value={targets.bmr} unit="kcal/j" desc="Mifflin-St Jeor" />
        <MetricCard label="Dépense totale (TDEE)" value={targets.tdee} unit="kcal/j" desc="BMR × multiplicateur" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Objectif calorique</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goalCards.map(({ type, icon: Icon, color, kcal }) => (
            <button
              key={type}
              onClick={() => {
                setSelectedGoal(type);
                if (!activePlan) createPlanForGoal(type);
                else {
                  savePlanAndSelect({ ...activePlan, goalType: type, updatedAt: new Date().toISOString() });
                }
              }}
              className={`relative p-5 rounded-2xl border text-left transition-all ${
                selectedGoal === type
                  ? 'border-transparent ring-2 ring-sky-500 bg-slate-800'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{GOAL_DESCS[type]}</p>
              <p className="text-2xl font-bold text-white mt-1">{kcal.toLocaleString()}</p>
              <p className="text-xs text-slate-400">kcal/jour</p>
              {selectedGoal === type && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {activePlan && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Objectifs macros</h2>
          <div className="grid grid-cols-3 gap-4">
            <MacroCard label="Protéines" value={targets.proteinesG} unit="g" color="bg-sky-500" pct={macroDistrib.proteines} />
            <MacroCard label="Glucides" value={targets.glucidesG} unit="g" color="bg-amber-500" pct={macroDistrib.glucides} />
            <MacroCard label="Lipides" value={targets.lipidesG} unit="g" color="bg-rose-500" pct={macroDistrib.lipides} />
          </div>
        </div>
      )}

      {activePlan && actuals && status && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Statut du plan — Jour {activeDay === 'entrainement' ? 'd\'entraînement' : 'de repos'}
          </h2>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
            <div className="flex items-center gap-3 mb-5">
              <StatusBadge status={status} />
              <span className="text-sm text-slate-300">
                {status === 'ok' && 'Plan dans les objectifs'}
                {status === 'warn' && 'Légèrement hors cible (±8%)'}
                {status === 'error' && 'Hors cible (>15%)'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CompareRow label="Calories" actual={actuals.kcal} target={targets.targetKcal} unit="kcal" />
              <CompareRow label="Protéines" actual={actuals.proteines} target={targets.proteinesG} unit="g" />
              <CompareRow label="Glucides" actual={actuals.glucides} target={targets.glucidesG} unit="g" />
              <CompareRow label="Lipides" actual={actuals.lipides} target={targets.lipidesG} unit="g" />
            </div>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Plans enregistrés</h2>
          <div className="space-y-2">
            {plans.filter(p => p.profileId === activeProfile.id).map(p => (
              <button
                key={p.id}
                onClick={() => { selectPlan(p.id); setSelectedGoal(p.goalType); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  activePlan?.id === p.id
                    ? 'border-sky-600 bg-sky-900/20'
                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                }`}
              >
                <span className="text-sm text-slate-200 font-medium">{p.nom}</span>
                <span className="text-xs text-slate-400">{GOAL_LABELS[p.goalType]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => createPlanForGoal(selectedGoal)}
            className="mt-3 flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors"
          >
            <Plus size={14} /> Nouveau plan
          </button>
        </div>
      )}

      {!activePlan && (
        <div className="text-center py-8 rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-400 mb-3">Aucun plan actif. Créez un plan pour commencer.</p>
          <button
            onClick={() => createPlanForGoal(selectedGoal)}
            className="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 transition-colors"
          >
            Créer un plan
          </button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, desc }: { label: string; value: number; unit: string; desc: string }) {
  return (
    <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-white">{value.toLocaleString()}</span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  );
}

function MacroCard({ label, value, unit, color, pct }: { label: string; value: number; unit: string; color: string; pct: number }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800/60">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">{pct}% des calories</p>
    </div>
  );
}

function CompareRow({ label, actual, target, unit }: { label: string; actual: number; target: number; unit: string }) {
  const remaining = target - actual;
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const over = actual > target;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-slate-300">{Math.round(actual)}/{target} {unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : 'bg-sky-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className={`text-xs mt-1 ${over ? 'text-rose-400' : remaining === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
        {over ? `+${Math.round(-remaining)}` : remaining > 0 ? `${Math.round(remaining)}` : '✓'} {unit}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: 'ok' | 'warn' | 'error' }) {
  if (status === 'ok') return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/50 border border-emerald-700 text-emerald-400 text-xs font-medium"><CheckCircle size={12} /> OK</span>;
  if (status === 'warn') return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/50 border border-amber-700 text-amber-400 text-xs font-medium"><AlertTriangle size={12} /> ATTENTION</span>;
  return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/50 border border-red-700 text-red-400 text-xs font-medium"><AlertCircle size={12} /> ERREUR</span>;
}
