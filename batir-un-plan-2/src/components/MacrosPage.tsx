import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { MACRO_PRESETS, DEFAULT_MACRO_PRESET, DEFAULT_PROTEIN_GKG, PROTEIN_GKG_MIN, PROTEIN_GKG_MAX, DEFAULT_PROTEIN_PCT, PROTEIN_PCT_MIN, PROTEIN_PCT_MAX, calculateTargets, getWeightKg } from '../utils/calculations';
import type { MacroPresetKey } from '../types';
import type { MacroDistribution, ProteinMode } from '../types';
import { AlertCircle } from 'lucide-react';

export default function MacrosPage() {
  const { activeProfile, activePlan, savePlanAndSelect } = useApp();

  const [preset, setPreset]       = useState<MacroPresetKey>((activePlan?.macroPreset as MacroPresetKey) ?? DEFAULT_MACRO_PRESET);
  const [distrib, setDistrib]     = useState<MacroDistribution>(activePlan?.macroDistribution ?? MACRO_PRESETS[DEFAULT_MACRO_PRESET]);
  const [proteinMode, setProteinMode] = useState<ProteinMode>(activePlan?.proteinMode ?? 'gkg');
  const [proteinGkg, setProteinGkg]   = useState(activePlan?.proteinGkg ?? DEFAULT_PROTEIN_GKG);
  const [proteinPct, setProteinPct]   = useState(activePlan?.macroDistribution?.proteines ?? DEFAULT_PROTEIN_PCT);

  useEffect(() => {
    if (activePlan) {
      setPreset(activePlan.macroPreset as MacroPresetKey);
      setDistrib(activePlan.macroDistribution);
      setProteinMode(activePlan.proteinMode);
      setProteinGkg(activePlan.proteinGkg);
      setProteinPct(activePlan.macroDistribution?.proteines ?? DEFAULT_PROTEIN_PCT);
    }
  }, [activePlan?.id]);

  if (!activeProfile) return <EmptyState msg="Aucun profil actif." />;
  if (!activePlan)    return <EmptyState msg="Aucun plan actif. Créez un plan depuis le tableau de bord." />;

  const weightKg = getWeightKg(activeProfile);
  // For pct mode, inject proteinPct into the distrib for target calc
  const distribForCalc: MacroDistribution = proteinMode === 'pct'
    ? { ...distrib, proteines: proteinPct }
    : distrib;
  const targets  = calculateTargets(activeProfile, distribForCalc, activePlan.goalType, proteinMode, proteinGkg, activePlan.customKcal);
  const total    = distrib.proteines + distrib.glucides + distrib.lipides;
  const isValid  = total === 100;

  function applyPreset(key: MacroPresetKey) {
    setPreset(key);
    if (key !== 'custom') setDistrib({ ...MACRO_PRESETS[key] });
  }

  function handleSlider(macro: keyof MacroDistribution, val: number) {
    setPreset('custom');
    const others = (['proteines', 'glucides', 'lipides'] as (keyof MacroDistribution)[]).filter(m => m !== macro);
    const rem = 100 - val;
    const otherSum = others.reduce((s, m) => s + distrib[m], 0);
    const nd = { ...distrib, [macro]: val };
    if (otherSum > 0) {
      others.forEach(m => { nd[m] = Math.round((distrib[m] / otherSum) * rem); });
    } else {
      nd[others[0]] = rem; nd[others[1]] = 0;
    }
    const sum = nd.proteines + nd.glucides + nd.lipides;
    if (sum !== 100) nd[others[others.length - 1]] += 100 - sum;
    setDistrib(nd);
  }

  function saveChanges() {
    // For pct mode, store proteinPct in the distribution
    const finalDistrib = proteinMode === 'pct' ? { ...distrib, proteines: proteinPct } : distrib;
    savePlanAndSelect({
      ...activePlan!,
      macroPreset: preset,
      macroDistribution: finalDistrib,
      proteinMode,
      proteinGkg,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Distribution des macros</h1>
        <p className="text-zinc-500 text-sm mt-1">Répartition des macronutriments pour <span className="text-gold">{activePlan.nom}</span></p>
      </div>

      {/* Protein mode */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">Mode de calcul des protéines</h3>
        <div className="flex gap-2 mb-4">
          {([['pct', '% calorique'], ['gkg', 'g / kg de poids']] as [ProteinMode, string][]).map(([m, l]) => (
            <button key={m} onClick={() => setProteinMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                proteinMode === m ? 'bg-gold/10 border-gold/50 text-gold' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}>
              {l}
            </button>
          ))}
        </div>

        {proteinMode === 'gkg' && (
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Protéines: <span className="text-gold font-semibold">{proteinGkg.toFixed(1)} g/kg</span>
              {' '}= <span className="text-zinc-200 font-medium">{Math.round(proteinGkg * weightKg)} g/jour</span> ({Math.round(weightKg)} kg)
            </label>
            <input type="range"
              min={PROTEIN_GKG_MIN} max={PROTEIN_GKG_MAX} step={0.1}
              value={proteinGkg}
              onChange={e => setProteinGkg(+e.target.value)}
              className="w-full accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>min {PROTEIN_GKG_MIN} g/kg</span>
              <span>max {PROTEIN_GKG_MAX} g/kg</span>
            </div>
          </div>
        )}
        {proteinMode === 'pct' && (
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Protéines: <span className="text-gold font-semibold">{proteinPct}%</span>
              {' '}= <span className="text-zinc-200 font-medium">{Math.round(targets.proteinesG)} g/jour</span>
            </label>
            <input type="range"
              min={PROTEIN_PCT_MIN} max={PROTEIN_PCT_MAX} step={1}
              value={proteinPct}
              onChange={e => setProteinPct(+e.target.value)}
              className="w-full accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>min {PROTEIN_PCT_MIN}%</span>
              <span>max {PROTEIN_PCT_MAX}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 8 Presets */}
      <div>
        <p className="section-title">Préréglages macros</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.entries(MACRO_PRESETS) as [MacroPresetKey, typeof MACRO_PRESETS[MacroPresetKey]][]).map(([key, p]) => (
            <button key={key} onClick={() => applyPreset(key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                preset === key ? 'border-gold/50 bg-gold/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}>
              <p className={`text-xs font-semibold mb-1 ${preset === key ? 'text-gold' : 'text-zinc-300'}`}>{p.label}</p>
              {key !== 'custom' && (
                <p className="text-xs text-zinc-500">{p.proteines}P / {p.glucides}G / {p.lipides}L</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Distribution visual + sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bars */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Répartition actuelle</h3>
          <MacroBar label="Protéines" pct={distrib.proteines} g={targets.proteinesG} color="bg-sky-500" />
          <MacroBar label="Glucides"  pct={distrib.glucides}  g={targets.glucidesG}  color="bg-amber-500" />
          <MacroBar label="Lipides"   pct={distrib.lipides}   g={targets.lipidesG}   color="bg-rose-500" />
          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-sm">
            <span className="text-zinc-400">Total</span>
            <span className={`font-semibold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>{total}%</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Ajustement personnalisé</h3>
          <div className="space-y-5">
            <SliderRow label="Protéines" value={distrib.proteines} accent="accent-sky-500"    onChange={v => handleSlider('proteines', v)} />
            <SliderRow label="Glucides"  value={distrib.glucides}  accent="accent-amber-500"  onChange={v => handleSlider('glucides', v)} />
            <SliderRow label="Lipides"   value={distrib.lipides}   accent="accent-rose-500"   onChange={v => handleSlider('lipides', v)} />
          </div>
          {!isValid && (
            <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> La somme doit être 100%
            </p>
          )}
        </div>
      </div>

      {/* Caloric preview */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">
          Aperçu — {targets.targetKcal.toLocaleString('fr-CA')} kcal/j
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-sky-400">{targets.proteinesG}g</p>
            <p className="text-xs text-zinc-500 mt-1">Protéines · {distrib.proteines}%</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{targets.glucidesG}g</p>
            <p className="text-xs text-zinc-500 mt-1">Glucides · {distrib.glucides}%</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-400">{targets.lipidesG}g</p>
            <p className="text-xs text-zinc-500 mt-1">Lipides · {distrib.lipides}%</p>
          </div>
        </div>
      </div>

      <button onClick={saveChanges} disabled={!isValid} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
        Enregistrer la distribution
      </button>
    </div>
  );
}

function MacroBar({ label, pct, g, color }: { label: string; pct: number; g: number; color: string }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-sm text-zinc-300">{label}</span>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-zinc-100">{g}g</span>
          <span className="text-zinc-500">{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SliderRow({ label, value, accent, onChange }: { label: string; value: number; accent: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm font-semibold text-zinc-100">{value}%</span>
      </div>
      <input type="range" min={5} max={70} step={1} value={value}
        onChange={e => onChange(+e.target.value)}
        className={`w-full h-2 rounded-full ${accent} bg-zinc-700 cursor-pointer`} />
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle size={36} className="text-zinc-600 mb-3" />
      <p className="text-zinc-400">{msg}</p>
    </div>
  );
}
