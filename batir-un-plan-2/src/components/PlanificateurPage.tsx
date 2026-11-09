import { useState } from 'react';
import { useApp } from '../store/AppContext';
import type { DayType, FoodCategory, MealSlot, DistributionMode, DayPlan } from '../types';
import {
  FOOD_ITEMS, FOOD_CATEGORIES, CATEGORY_LABELS, MEAL_SLOT_LABELS, MEAL_SLOTS,
  computeBankTotals, getSelectedItem,
  distributeClassique, distributeEntrainement, distributeEquilibree, portionMapToMeals,
} from '../utils/foodBank';
import { calculateBaseHydration, calculateTargets, MACRO_PRESETS } from '../utils/calculations';
import type { MacroPresetKey } from '../types';
import { AlertCircle, Dumbbell, Bed, Shuffle, Droplets, ChevronDown, ChevronUp } from 'lucide-react';

export default function PlanificateurPage() {
  const { activeProfile, activePlan, savePlanAndSelect, activeDay, setActiveDay } = useApp();
  const [expandedMeal, setExpandedMeal] = useState<MealSlot | null>(null);

  if (!activeProfile) return <EmptyState msg="Aucun profil actif. Créez un profil d'abord." />;
  if (!activePlan)    return <EmptyState msg="Aucun plan actif. Créez un plan depuis le tableau de bord." />;

  const dayPlan: DayPlan = activeDay === 'entrainement'
    ? activePlan.joursEntrainement
    : activePlan.joursRepos;

  const macroPreset = (activePlan.macroPreset as MacroPresetKey) ?? 'equilibre';
  const macroDistrib = activePlan.macroDistribution ?? MACRO_PRESETS[macroPreset];
  const targets = calculateTargets(activeProfile, macroDistrib, activePlan.goalType, activePlan.proteinMode, activePlan.proteinGkg, activePlan.customKcal);
  const bankTotals = computeBankTotals(dayPlan.foodBank);
  const baseHydration = calculateBaseHydration(activeProfile, activeDay === 'entrainement');

  function updateDay(patch: Partial<DayPlan>) {
    const field = activeDay === 'entrainement' ? 'joursEntrainement' : 'joursRepos';
    savePlanAndSelect({
      ...activePlan!,
      [field]: { ...dayPlan, ...patch },
      updatedAt: new Date().toISOString(),
    });
  }

  function updateFoodBank(cat: FoodCategory, qty: number) {
    updateDay({ foodBank: { ...dayPlan.foodBank, [cat]: Math.max(0, qty) } });
  }

  function updateSelectedFood(cat: FoodCategory, id: string) {
    const key = `selected${cat.charAt(0).toUpperCase() + cat.slice(1)}` as keyof typeof dayPlan.foodBank;
    updateDay({ foodBank: { ...dayPlan.foodBank, [key]: id } });
  }

  function applyDistribution(mode: DistributionMode) {
    let portionMap;
    if (mode === 'classique') portionMap = distributeClassique(dayPlan.foodBank);
    else if (mode === 'entrainement') portionMap = distributeEntrainement(dayPlan.foodBank, 'matin');
    else portionMap = distributeEquilibree(dayPlan.foodBank);
    updateDay({ distributionMode: mode, meals: portionMapToMeals(portionMap) });
  }

  function updateHydrationManuel(ml: number) {
    const total = baseHydration + ml;
    updateDay({ hydratation: { base: baseHydration, manuel: ml, total } });
  }

  const hydManuel = dayPlan.hydratation.manuel || 0;
  const hydTotal  = baseHydration + hydManuel;

  const remaining = {
    proteines: targets.proteinesG - bankTotals.proteines,
    glucides:  targets.glucidesG  - bankTotals.glucides,
    lipides:   targets.lipidesG   - bankTotals.lipides,
    kcal:      targets.targetKcal - bankTotals.kcal,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Planificateur de repas</h1>
          <p className="text-zinc-500 text-sm mt-1">{activePlan.nom}</p>
        </div>
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
          {(['entrainement', 'repos'] as DayType[]).map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeDay === d ? 'bg-gold/10 text-gold border-r border-zinc-800' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}>
              {d === 'entrainement' ? <Dumbbell size={14} /> : <Bed size={14} />}
              {d === 'entrainement' ? 'Entraînement' : 'Repos'}
            </button>
          ))}
        </div>
      </div>

      {/* Running totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TotalBar label="Calories"  actual={bankTotals.kcal}      target={targets.targetKcal} unit="kcal" />
        <TotalBar label="Protéines" actual={bankTotals.proteines} target={targets.proteinesG} unit="g"    color="sky" />
        <TotalBar label="Glucides"  actual={bankTotals.glucides}  target={targets.glucidesG}  unit="g"    color="amber" />
        <TotalBar label="Lipides"   actual={bankTotals.lipides}   target={targets.lipidesG}   unit="g"    color="rose" />
      </div>

      {/* Training time (entrainement only) */}
      {activeDay === 'entrainement' && (
        <div className="card p-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Dumbbell size={15} className="text-gold" />
            <span className="text-sm font-medium text-zinc-300">Heure d'entraînement :</span>
          </div>
          <input
            type="time"
            value={dayPlan.heureEntrainement}
            onChange={e => updateDay({ heureEntrainement: e.target.value })}
            className="input-field w-32 text-sm"
          />
        </div>
      )}

      {/* Food Bank */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">Banque d'équivalents journalière</h2>
          <p className="text-xs text-zinc-500">Définissez le nombre de portions par catégorie</p>
        </div>
        <div className="p-5 space-y-4">
          {FOOD_CATEGORIES.map(cat => {
            const item = getSelectedItem(dayPlan.foodBank, cat);
            const qty  = dayPlan.foodBank[cat as keyof typeof dayPlan.foodBank] as number;
            const selectedId = dayPlan.foodBank[`selected${cat.charAt(0).toUpperCase() + cat.slice(1)}` as keyof typeof dayPlan.foodBank] as string;
            return (
              <div key={cat} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs font-semibold text-zinc-300 mb-1">{CATEGORY_LABELS[cat]}</p>
                  {item && (
                    <p className="text-xs text-zinc-500">
                      {item.poidsG}g · {item.proteines}P / {item.glucides}G / {item.lipides}L · {item.kcal} kcal/portion
                    </p>
                  )}
                </div>
                {/* Food selector */}
                <select
                  value={selectedId}
                  onChange={e => updateSelectedFood(cat, e.target.value)}
                  className="input-field w-44 text-xs py-1.5"
                >
                  {FOOD_ITEMS[cat].map(f => (
                    <option key={f.id} value={f.id}>{f.nom}</option>
                  ))}
                </select>
                {/* Portion counter */}
                <div className="flex items-center gap-2">
                  <button onClick={() => updateFoodBank(cat, qty - 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors text-lg leading-none">−</button>
                  <span className="text-sm font-bold text-zinc-100 w-5 text-center">{qty}</span>
                  <button onClick={() => updateFoodBank(cat, qty + 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors text-lg leading-none">+</button>
                </div>
                {/* Subtotal */}
                {item && qty > 0 && (
                  <div className="text-xs text-zinc-400 min-w-[90px] text-right">
                    <span className="text-zinc-200 font-medium">{Math.round(item.proteines * qty)}P</span> /
                    <span> {Math.round(item.glucides * qty)}G</span> /
                    <span> {Math.round(item.lipides * qty)}L</span>
                    <span className="ml-1 text-zinc-500">({Math.round(item.kcal * qty)} kcal)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Totals row */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/80 flex flex-wrap gap-4 text-sm">
          <span className="text-zinc-400">Total banque :</span>
          <span className="text-sky-400 font-semibold">{bankTotals.proteines}g P</span>
          <span className="text-amber-400 font-semibold">{bankTotals.glucides}g G</span>
          <span className="text-rose-400 font-semibold">{bankTotals.lipides}g L</span>
          <span className="text-zinc-200 font-semibold">{bankTotals.kcal} kcal</span>
          <span className="ml-auto text-zinc-500">
            Restant :
            <span className={remaining.kcal < 0 ? ' text-red-400' : ' text-emerald-400'}> {remaining.kcal > 0 ? '+' : ''}{remaining.kcal} kcal</span>
          </span>
        </div>
      </div>

      {/* Distribution */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">Répartition sur 6 repas</h2>
          <div className="flex gap-2 flex-wrap">
            <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Shuffle size={12} /> Répartition automatique :</p>
            {(['classique', 'entrainement', 'equilibree'] as DistributionMode[]).map(m => (
              <button key={m} onClick={() => applyDistribution(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  dayPlan.distributionMode === m ? 'bg-gold/10 border-gold/40 text-gold' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}>
                {m === 'classique' ? 'Classique' : m === 'entrainement' ? 'Selon entraînement' : 'Équilibrée'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {MEAL_SLOTS.map(slot => {
            const mealData = dayPlan.meals[slot];
            const slotTotals = { p: 0, g: 0, l: 0, k: 0 };
            mealData.portions.forEach(pt => {
              const item = getSelectedItem(dayPlan.foodBank, pt.category);
              if (item) {
                slotTotals.p += item.proteines * pt.portions;
                slotTotals.g += item.glucides  * pt.portions;
                slotTotals.l += item.lipides   * pt.portions;
                slotTotals.k += item.kcal      * pt.portions;
              }
            });
            const hasContent = mealData.portions.length > 0;
            const isExpanded = expandedMeal === slot;

            // Determine if this meal is pre/post workout (based on training time)
            let timingTag = '';
            if (activeDay === 'entrainement' && dayPlan.heureEntrainement) {
              const [h] = dayPlan.heureEntrainement.split(':').map(Number);
              const slotHours: Record<MealSlot, number> = {
                petitDejeuner: 7, collationMatin: 10, dejeuner: 12,
                collationAprem: 15, diner: 18, collationSoir: 21,
              };
              const slotH = slotHours[slot];
              if (Math.abs(slotH - h) <= 1 && slotH < h) timingTag = 'pré-entraînement';
              else if (slotH > h && slotH <= h + 2) timingTag = 'post-entraînement';
            }

            return (
              <div key={slot} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                <button
                  onClick={() => setExpandedMeal(isExpanded ? null : slot)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-200">{MEAL_SLOT_LABELS[slot]}</span>
                    {timingTag && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        timingTag === 'pré-entraînement' ? 'bg-amber-900/30 border-amber-700/50 text-amber-400' : 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                      }`}>{timingTag}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {hasContent && (
                      <div className="flex gap-2 text-xs text-zinc-400">
                        <span className="text-sky-400">{Math.round(slotTotals.p)}P</span>
                        <span className="text-amber-400">{Math.round(slotTotals.g)}G</span>
                        <span className="text-rose-400">{Math.round(slotTotals.l)}L</span>
                        <span className="text-zinc-300 font-medium">{Math.round(slotTotals.k)} kcal</span>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
                    {FOOD_CATEGORIES.map(cat => {
                      const pt = mealData.portions.find(p => p.category === cat);
                      const item = getSelectedItem(dayPlan.foodBank, cat);
                      const portionsInSlot = pt?.portions ?? 0;
                      return (
                        <div key={cat} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-zinc-400 w-36 text-xs">{CATEGORY_LABELS[cat]}</span>
                          {item && <span className="text-zinc-600 text-xs flex-1 truncate">{item.nom}</span>}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const newPortions = mealData.portions.map(p =>
                                  p.category === cat ? { ...p, portions: Math.max(0, p.portions - 0.5) } : p
                                ).filter(p => p.portions > 0);
                                if (portionsInSlot > 0) {
                                  const updated = { ...dayPlan.meals, [slot]: { ...mealData, portions: newPortions } };
                                  updateDay({ meals: updated });
                                }
                              }}
                              className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm transition-colors">−</button>
                            <span className="text-zinc-200 w-6 text-center font-medium text-xs">{portionsInSlot}</span>
                            <button
                              onClick={() => {
                                const existing = mealData.portions.find(p => p.category === cat);
                                let newPortions;
                                if (existing) {
                                  newPortions = mealData.portions.map(p =>
                                    p.category === cat ? { ...p, portions: p.portions + 0.5 } : p
                                  );
                                } else {
                                  newPortions = [...mealData.portions, { category: cat, portions: 0.5 }];
                                }
                                const updated = { ...dayPlan.meals, [slot]: { ...mealData, portions: newPortions } };
                                updateDay({ meals: updated });
                              }}
                              className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm transition-colors">+</button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Notes */}
                    <textarea
                      value={mealData.customNotes}
                      onChange={e => {
                        const updated = { ...dayPlan.meals, [slot]: { ...mealData, customNotes: e.target.value } };
                        updateDay({ meals: updated });
                      }}
                      rows={2}
                      placeholder="Notes pour ce repas..."
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold/40 resize-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydration */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Droplets size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Hydratation</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Base (35 ml/kg)</p>
            <p className="text-xl font-bold text-blue-400">{baseHydration}</p>
            <p className="text-xs text-zinc-500">ml</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-xs text-zinc-500 mb-1">Ajout manuel</p>
            <input
              type="number" min={0} step={100}
              value={hydManuel}
              onChange={e => updateHydrationManuel(+e.target.value)}
              className="input-field text-center text-xl font-bold text-blue-300 py-1"
            />
            <p className="text-xs text-zinc-500">ml</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-900/20 border border-blue-800/50">
            <p className="text-xs text-blue-400 mb-1">Total</p>
            <p className="text-xl font-bold text-blue-300">{hydTotal}</p>
            <p className="text-xs text-blue-500">ml ({(hydTotal / 1000).toFixed(1)} L)</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Notes — Journée {activeDay === 'entrainement' ? 'd\'entraînement' : 'de repos'}
        </label>
        <textarea
          value={dayPlan.notes}
          onChange={e => updateDay({ notes: e.target.value })}
          rows={3}
          placeholder="Recommandations, instructions, compléments..."
          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
        />
      </div>
    </div>
  );
}

function TotalBar({ label, actual, target, unit, color = 'gold' }: {
  label: string; actual: number; target: number; unit: string; color?: string;
}) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const over = actual > target * 1.05;
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-500', amber: 'bg-amber-500', rose: 'bg-rose-500', gold: 'bg-yellow-500',
  };
  return (
    <div className="card p-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-300">{Math.round(actual)}/{target}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1">
        <div className={`h-full rounded-full ${over ? 'bg-red-500' : colorMap[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500">{unit}</span>
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
