import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { MACRO_PRESETS, calculateTargets } from '../utils/calculations';
import type { MacroPresetKey } from '../utils/calculations';
import type { MacroDistribution } from '../types';
import { AlertCircle } from 'lucide-react';

export default function MacrosPage() {
  const { activeProfile, activePlan, savePlanAndSelect } = useApp();

  const [preset, setPreset] = useState<MacroPresetKey>((activePlan?.macroPreset as MacroPresetKey) ?? 'equilibre');
  const [distrib, setDistrib] = useState<MacroDistribution>(
    activePlan?.macroDistribution ?? MACRO_PRESETS.equilibre
  );

  useEffect(() => {
    if (activePlan) {
      setPreset(activePlan.macroPreset as MacroPresetKey);
      setDistrib(activePlan.macroDistribution);
    }
  }, [activePlan?.id]);

  if (!activeProfile) {
    return <EmptyState message="Aucun profil actif. Créez un profil d'abord." />;
  }

  if (!activePlan) {
    return <EmptyState message="Aucun plan actif. Créez un plan depuis le tableau de bord." />;
  }

  const targets = calculateTargets(activeProfile, distrib, activePlan.goalType, activePlan.customKcal);
  const total = distrib.proteines + distrib.glucides + distrib.lipides;
  const isValid = total === 100;

  function applyPreset(key: MacroPresetKey) {
    setPreset(key);
    if (key !== 'custom') {
      setDistrib({
        proteines: MACRO_PRESETS[key].proteines,
        glucides: MACRO_PRESETS[key].glucides,
        lipides: MACRO_PRESETS[key].lipides,
      });
    }
  }

  function handleSliderChange(macro: keyof MacroDistribution, value: number) {
    setPreset('custom');
    const others = (['proteines', 'glucides', 'lipides'] as (keyof MacroDistribution)[]).filter(m => m !== macro);
    const remaining = 100 - value;
    const totalOthers = others.reduce((s, m) => s + distrib[m], 0);

    const newDistrib = { ...distrib, [macro]: value };
    if (totalOthers > 0) {
      others.forEach(m => {
        newDistrib[m] = Math.round((distrib[m] / totalOthers) * remaining);
      });
    } else {
      newDistrib[others[0]] = remaining;
      newDistrib[others[1]] = 0;
    }
    // Ensure sum = 100
    const sum = newDistrib.proteines + newDistrib.glucides + newDistrib.lipides;
    if (sum !== 100) {
      newDistrib[others[others.length - 1]] += 100 - sum;
    }
    setDistrib(newDistrib);
  }

  function saveChanges() {
    savePlanAndSelect({
      ...activePlan!,
      macroPreset: preset,
      macroDistribution: distrib,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Distribution des macros</h1>
        <p className="text-slate-400 text-sm mt-1">Définissez la répartition des macronutriments pour <span className="text-sky-400">{activePlan.nom}</span></p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Préréglages</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MACRO_PRESETS) as MacroPresetKey[]).map(key => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                preset === key
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {MACRO_PRESETS[key].label}
              {key !== 'custom' && (
                <span className="ml-2 text-xs opacity-70">
                  {MACRO_PRESETS[key].proteines}P/{MACRO_PRESETS[key].glucides}G/{MACRO_PRESETS[key].lipides}L
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Répartition actuelle</h3>
          <MacroBar label="Protéines" pct={distrib.proteines} grams={targets.proteinesG} color="bg-sky-500" />
          <MacroBar label="Glucides" pct={distrib.glucides} grams={targets.glucidesG} color="bg-amber-500" />
          <MacroBar label="Lipides" pct={distrib.lipides} grams={targets.lipidesG} color="bg-rose-500" />
          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm">
            <span className="text-slate-400">Total</span>
            <span className={`font-semibold ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>{total}%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Ajustement personnalisé</h3>
          <div className="space-y-5">
            <SliderRow
              label="Protéines" value={distrib.proteines}
              accentColor="accent-sky-500"
              onChange={v => handleSliderChange('proteines', v)}
            />
            <SliderRow
              label="Glucides" value={distrib.glucides}
              accentColor="accent-amber-500"
              onChange={v => handleSliderChange('glucides', v)}
            />
            <SliderRow
              label="Lipides" value={distrib.lipides}
              accentColor="accent-rose-500"
              onChange={v => handleSliderChange('lipides', v)}
            />
          </div>
          {!isValid && (
            <p className="mt-3 text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> La somme doit être égale à 100%
            </p>
          )}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Aperçu calorique pour {targets.targetKcal.toLocaleString()} kcal/j</h3>
        <div className="grid grid-cols-3 gap-4">
          <PreviewCard label="Protéines" g={targets.proteinesG} pct={distrib.proteines} color="text-sky-400" />
          <PreviewCard label="Glucides" g={targets.glucidesG} pct={distrib.glucides} color="text-amber-400" />
          <PreviewCard label="Lipides" g={targets.lipidesG} pct={distrib.lipides} color="text-rose-400" />
        </div>
      </div>

      <button
        onClick={saveChanges}
        disabled={!isValid}
        className="px-6 py-2.5 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Enregistrer la distribution
      </button>
    </div>
  );
}

function MacroBar({ label, pct, grams, color }: { label: string; pct: number; grams: number; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-sm text-slate-300">{label}</span>
        </div>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="text-white font-semibold">{grams}g</span>
          <span className="text-slate-400">{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, accentColor, onChange }: { label: string; value: number; accentColor: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-white">{value}%</span>
      </div>
      <input
        type="range"
        min={5} max={70} step={1}
        value={value}
        onChange={e => onChange(+e.target.value)}
        className={`w-full h-2 rounded-full ${accentColor} bg-slate-700 cursor-pointer`}
      />
    </div>
  );
}

function PreviewCard({ label, g, pct, color }: { label: string; g: number; pct: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${color}`}>{g}g</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
      <p className="text-xs text-slate-500">{pct}%</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle size={36} className="text-slate-500 mb-3" />
      <p className="text-slate-400">{message}</p>
    </div>
  );
}
