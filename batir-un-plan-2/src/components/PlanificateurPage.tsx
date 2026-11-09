import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { MealEntry, DayType, MealTiming, DayPlan } from '../types';
import { v4 } from '../utils/uuid';
import { calculateMealKcal, calculateDayTotals, calculateTargets, MACRO_PRESETS } from '../utils/calculations';
import type { MacroPresetKey } from '../utils/calculations';
import { Plus, Trash2, AlertCircle, Clock, Dumbbell, Bed } from 'lucide-react';

const TIMING_LABELS: Record<MealTiming, string> = {
  pre: 'Pré-entraînement',
  post: 'Post-entraînement',
  normal: 'Normal',
};

const TIMING_COLORS: Record<MealTiming, string> = {
  pre: 'bg-amber-500/20 text-amber-400 border-amber-700',
  post: 'bg-emerald-500/20 text-emerald-400 border-emerald-700',
  normal: 'bg-slate-700 text-slate-400 border-slate-600',
};

export default function PlanificateurPage() {
  const { activeProfile, activePlan, savePlanAndSelect, activeDay, setActiveDay } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!activeProfile) return <EmptyState msg="Aucun profil actif. Créez un profil d'abord." />;
  if (!activePlan) return <EmptyState msg="Aucun plan actif. Créez un plan depuis le tableau de bord." />;

  const macroPreset = (activePlan.macroPreset as MacroPresetKey) ?? 'equilibre';
  const macroDistrib = activePlan.macroDistribution ?? MACRO_PRESETS[macroPreset];
  const targets = calculateTargets(activeProfile, macroDistrib, activePlan.goalType, activePlan.customKcal);

  const dayPlan: DayPlan = activeDay === 'entrainement'
    ? activePlan.joursEntrainement
    : activePlan.joursRepos;

  const totals = calculateDayTotals(dayPlan);

  function updateDay(updated: DayPlan) {
    const updatedPlan = {
      ...activePlan!,
      [activeDay === 'entrainement' ? 'joursEntrainement' : 'joursRepos']: updated,
      updatedAt: new Date().toISOString(),
    };
    savePlanAndSelect(updatedPlan);
  }

  function addMeal() {
    const newMeal: MealEntry = {
      id: v4(),
      nom: `Repas ${dayPlan.repas.length + 1}`,
      timing: 'normal',
      proteines: 0,
      glucides: 0,
      lipides: 0,
      kcal: 0,
      manualKcal: false,
    };
    updateDay({ ...dayPlan, repas: [...dayPlan.repas, newMeal] });
    setEditingId(newMeal.id);
  }

  function updateMeal(id: string, patch: Partial<MealEntry>) {
    const repas = dayPlan.repas.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...patch };
      if (!updated.manualKcal) {
        updated.kcal = calculateMealKcal(updated.proteines, updated.glucides, updated.lipides);
      }
      return updated;
    });
    updateDay({ ...dayPlan, repas });
  }

  function removeMeal(id: string) {
    updateDay({ ...dayPlan, repas: dayPlan.repas.filter(r => r.id !== id) });
  }

  function updateNotes(notes: string) {
    updateDay({ ...dayPlan, notes });
  }

  const remaining = {
    proteines: targets.proteinesG - totals.proteines,
    glucides: targets.glucidesG - totals.glucides,
    lipides: targets.lipidesG - totals.lipides,
    kcal: targets.targetKcal - totals.kcal,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Planificateur de repas</h1>
          <p className="text-slate-400 text-sm mt-1">{activePlan.nom}</p>
        </div>
        <div className="flex rounded-xl border border-slate-700 overflow-hidden">
          {(['entrainement', 'repos'] as DayType[]).map(d => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeDay === d ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d === 'entrainement' ? <Dumbbell size={14} /> : <Bed size={14} />}
              {d === 'entrainement' ? 'Entraînement' : 'Repos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TotalBar label="Calories" actual={totals.kcal} target={targets.targetKcal} unit="kcal" />
        <TotalBar label="Protéines" actual={totals.proteines} target={targets.proteinesG} unit="g" color="sky" />
        <TotalBar label="Glucides" actual={totals.glucides} target={targets.glucidesG} unit="g" color="amber" />
        <TotalBar label="Lipides" actual={totals.lipides} target={targets.lipidesG} unit="g" color="rose" />
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-200">Repas du jour</h2>
          <button
            onClick={addMeal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 transition-colors"
          >
            <Plus size={13} /> Ajouter un repas
          </button>
        </div>

        {dayPlan.repas.length === 0 ? (
          <div className="py-12 text-center">
            <Clock size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Aucun repas ajouté. Cliquez sur "Ajouter un repas".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Repas</th>
                  <th className="px-4 py-3 text-left">Timing</th>
                  <th className="px-4 py-3 text-right">Protéines (g)</th>
                  <th className="px-4 py-3 text-right">Glucides (g)</th>
                  <th className="px-4 py-3 text-right">Lipides (g)</th>
                  <th className="px-4 py-3 text-right">kcal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {dayPlan.repas.map((repas, idx) => (
                  <MealRow
                    key={repas.id}
                    repas={repas}
                    idx={idx}
                    isEditing={editingId === repas.id}
                    onToggleEdit={() => setEditingId(editingId === repas.id ? null : repas.id)}
                    onUpdate={(patch) => updateMeal(repas.id, patch)}
                    onRemove={() => removeMeal(repas.id)}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700 font-semibold text-slate-200 bg-slate-800/80">
                  <td className="px-4 py-3 text-sm" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right text-sky-400">{Math.round(totals.proteines)}g</td>
                  <td className="px-4 py-3 text-right text-amber-400">{Math.round(totals.glucides)}g</td>
                  <td className="px-4 py-3 text-right text-rose-400">{Math.round(totals.lipides)}g</td>
                  <td className="px-4 py-3 text-right">{Math.round(totals.kcal)}</td>
                  <td />
                </tr>
                <tr className="text-xs text-slate-500 bg-slate-800/40">
                  <td className="px-4 py-2" colSpan={2}>Restant</td>
                  <td className={`px-4 py-2 text-right ${remaining.proteines < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {remaining.proteines >= 0 ? `${Math.round(remaining.proteines)}g` : `-${Math.round(-remaining.proteines)}g`}
                  </td>
                  <td className={`px-4 py-2 text-right ${remaining.glucides < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {remaining.glucides >= 0 ? `${Math.round(remaining.glucides)}g` : `-${Math.round(-remaining.glucides)}g`}
                  </td>
                  <td className={`px-4 py-2 text-right ${remaining.lipides < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {remaining.lipides >= 0 ? `${Math.round(remaining.lipides)}g` : `-${Math.round(-remaining.lipides)}g`}
                  </td>
                  <td className={`px-4 py-2 text-right ${remaining.kcal < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {remaining.kcal >= 0 ? `${Math.round(remaining.kcal)} kcal` : `-${Math.round(-remaining.kcal)} kcal`}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Notes du plan — Jour {activeDay === 'entrainement' ? 'd\'entraînement' : 'de repos'}
        </label>
        <textarea
          value={dayPlan.notes}
          onChange={e => updateNotes(e.target.value)}
          rows={4}
          placeholder="Notes, instructions, recommandations..."
          className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-none"
        />
      </div>
    </div>
  );
}

function MealRow({
  repas, idx, isEditing, onToggleEdit, onUpdate, onRemove
}: {
  repas: MealEntry;
  idx: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdate: (patch: Partial<MealEntry>) => void;
  onRemove: () => void;
}) {
  const displayKcal = repas.manualKcal
    ? repas.kcal
    : calculateMealKcal(repas.proteines, repas.glucides, repas.lipides);

  return (
    <>
      <tr
        className={`border-b border-slate-700/50 hover:bg-slate-700/20 cursor-pointer transition-colors ${isEditing ? 'bg-slate-700/30' : ''}`}
        onClick={onToggleEdit}
      >
        <td className="px-4 py-3">
          <span className="text-slate-200 font-medium">{repas.nom}</span>
          <span className="ml-2 text-xs text-slate-500">#{idx + 1}</span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${TIMING_COLORS[repas.timing]}`}>
            {TIMING_LABELS[repas.timing]}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sky-300">{repas.proteines || 0}</td>
        <td className="px-4 py-3 text-right text-amber-300">{repas.glucides || 0}</td>
        <td className="px-4 py-3 text-right text-rose-300">{repas.lipides || 0}</td>
        <td className="px-4 py-3 text-right text-slate-200">{displayKcal}</td>
        <td className="px-4 py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </td>
      </tr>
      {isEditing && (
        <tr className="bg-slate-700/20">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Nom du repas</label>
                <input
                  type="text"
                  value={repas.nom}
                  onChange={e => onUpdate({ nom: e.target.value })}
                  className="input-field w-full text-sm"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Timing</label>
                <select
                  value={repas.timing}
                  onChange={e => onUpdate({ timing: e.target.value as MealTiming })}
                  className="input-field w-full text-sm"
                  onClick={e => e.stopPropagation()}
                >
                  {(Object.entries(TIMING_LABELS) as [MealTiming, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-sky-400 mb-1 block">Protéines (g)</label>
                <input
                  type="number" min={0} step={0.5}
                  value={repas.proteines}
                  onChange={e => onUpdate({ proteines: +e.target.value })}
                  className="input-field w-full text-sm"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="text-xs text-amber-400 mb-1 block">Glucides (g)</label>
                <input
                  type="number" min={0} step={0.5}
                  value={repas.glucides}
                  onChange={e => onUpdate({ glucides: +e.target.value })}
                  className="input-field w-full text-sm"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="text-xs text-rose-400 mb-1 block">Lipides (g)</label>
                <input
                  type="number" min={0} step={0.5}
                  value={repas.lipides}
                  onChange={e => onUpdate({ lipides: +e.target.value })}
                  className="input-field w-full text-sm"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={repas.manualKcal}
                  onChange={e => onUpdate({ manualKcal: e.target.checked })}
                  className="accent-sky-500"
                  onClick={e => e.stopPropagation()}
                />
                Saisir les kcal manuellement
              </label>
              {repas.manualKcal && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">kcal:</label>
                  <input
                    type="number" min={0}
                    value={repas.kcal}
                    onChange={e => onUpdate({ kcal: +e.target.value })}
                    className="input-field w-24 text-sm"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )}
              {!repas.manualKcal && (
                <span className="text-xs text-slate-500">
                  kcal auto: {displayKcal} (4·P + 4·G + 9·L)
                </span>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TotalBar({ label, actual, target, unit, color = 'slate' }: {
  label: string; actual: number; target: number; unit: string; color?: string;
}) {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  const over = actual > target * 1.05;
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-400',
  };
  const barColor = over ? 'bg-rose-500' : (colorMap[color] ?? 'bg-sky-500');

  return (
    <div className="p-3 rounded-xl border border-slate-700 bg-slate-800/60">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-slate-300">{Math.round(actual)}/{target}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden mb-1">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{unit}</span>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle size={36} className="text-slate-500 mb-3" />
      <p className="text-slate-400">{msg}</p>
    </div>
  );
}
