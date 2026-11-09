import { useRef } from 'react';
import { useApp } from '../store/AppContext';
import {
  calculateTargets, MACRO_PRESETS, ACTIVITY_LABELS, GOAL_LABELS,
  getWeightKg, getHeightCm, calculateBaseHydration, validatePlan,
} from '../utils/calculations';
import type { MacroPresetKey } from '../types';
import {
  FOOD_CATEGORIES, CATEGORY_LABELS, MEAL_SLOT_LABELS, MEAL_SLOTS,
  computeBankTotals, getSelectedItem,
} from '../utils/foodBank';
import type { DayPlan } from '../types';
import { FileDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import ElevateLogo from './ElevateLogo';

export default function RecapPage() {
  const { activeProfile, activePlan } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!activeProfile || !activePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={36} className="text-zinc-600 mb-3" />
        <p className="text-zinc-400">Profil ou plan manquant.</p>
      </div>
    );
  }

  const macroDistrib = activePlan.macroDistribution ?? MACRO_PRESETS[activePlan.macroPreset as MacroPresetKey];
  const targets = calculateTargets(activeProfile, macroDistrib, activePlan.goalType, activePlan.proteinMode, activePlan.proteinGkg, activePlan.customKcal);

  const trainingTotals = computeBankTotals(activePlan.joursEntrainement.foodBank);
  const reposTotals    = computeBankTotals(activePlan.joursRepos.foodBank);

  const trainingValidation = validatePlan(
    trainingTotals.kcal, targets.targetKcal,
    trainingTotals.proteines, targets.proteinesG,
    trainingTotals.glucides,  targets.glucidesG,
    trainingTotals.lipides,   targets.lipidesG,
  );
  const reposValidation = validatePlan(
    reposTotals.kcal, targets.targetKcal,
    reposTotals.proteines, targets.proteinesG,
    reposTotals.glucides,  targets.glucidesG,
    reposTotals.lipides,   targets.lipidesG,
  );

  const weightKg  = getWeightKg(activeProfile).toFixed(1);
  const heightCm  = getHeightCm(activeProfile).toFixed(0);
  const hydTraining = calculateBaseHydration(targets.targetKcal) + (activePlan.joursEntrainement.hydratation.manuel ?? 0);
  const hydRepos    = calculateBaseHydration(targets.targetKcal) + (activePlan.joursRepos.hydratation.manuel ?? 0);

  async function handleExportPDF() {
    if (!printRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#09090b',
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgW = pw;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/png');

      let yPos = 0;
      let heightLeft = imgH;
      pdf.addImage(imgData, 'PNG', 0, yPos, imgW, imgH);
      heightLeft -= ph;
      while (heightLeft > 0) {
        yPos -= ph;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yPos, imgW, imgH);
        heightLeft -= ph;
      }

      pdf.save(`elevate-plan-${activeProfile!.nom.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erreur PDF — vérifiez la console.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Récapitulatif nutritionnel</h1>
          <p className="text-zinc-500 text-sm mt-1">Vue complète du plan alimentaire</p>
        </div>
        <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
          <FileDown size={15} /> Exporter PDF
        </button>
      </div>

      {/* PDF content */}
      <div ref={printRef} className="space-y-5">

        {/* Header card */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <ElevateLogo size={40} />
              <div>
                <p className="text-gold font-bold text-lg tracking-wide">ELEVATE FITNESS</p>
                <p className="text-zinc-400 text-xs">Plan nutritionnel personnalisé</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Généré le</p>
              <p className="text-sm text-zinc-300">{new Date().toLocaleDateString('fr-CA')}</p>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-4">
            <h2 className="text-xl font-bold text-zinc-100">{activeProfile.nom}</h2>
            <p className="text-gold text-sm mt-0.5">{activePlan.nom}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <InfoBlock label="Sexe"            value={activeProfile.sexe === 'homme' ? 'Homme' : 'Femme'} />
            <InfoBlock label="Âge"             value={`${activeProfile.age} ans`} />
            <InfoBlock label="Poids"           value={`${weightKg} kg`} />
            <InfoBlock label="Taille"          value={`${heightCm} cm`} />
            <InfoBlock label="Activité"        value={ACTIVITY_LABELS[activeProfile.niveauActivite].split('(')[0].trim()} />
            <InfoBlock label="Objectif"        value={GOAL_LABELS[activePlan.goalType]} />
            <InfoBlock label="BMR"             value={`${targets.bmr} kcal/j`} />
            <InfoBlock label="TDEE"            value={`${targets.tdee} kcal/j`} />
          </div>
        </div>

        {/* Macro targets */}
        <div className="card p-5">
          <h3 className="section-title">Objectifs quotidiens</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <TargetBlock label="Calories"  value={`${targets.targetKcal.toLocaleString('fr-CA')} kcal`} accent="text-gold" />
            <TargetBlock label="Protéines" value={`${targets.proteinesG}g`}  accent="text-sky-400" sub={`${macroDistrib.proteines}%`} />
            <TargetBlock label="Glucides"  value={`${targets.glucidesG}g`}   accent="text-amber-400" sub={`${macroDistrib.glucides}%`} />
            <TargetBlock label="Lipides"   value={`${targets.lipidesG}g`}    accent="text-rose-400" sub={`${macroDistrib.lipides}%`} />
          </div>
        </div>

        {/* Training day */}
        <DayRecapCard
          title="Journée d'entraînement"
          dayPlan={activePlan.joursEntrainement}
          targets={targets}
          totals={trainingTotals}
          validation={trainingValidation}
          hydration={hydTraining}
        />

        {/* Rest day */}
        <DayRecapCard
          title="Journée de repos"
          dayPlan={activePlan.joursRepos}
          targets={targets}
          totals={reposTotals}
          validation={reposValidation}
          hydration={hydRepos}
        />

        {/* Notes */}
        {(activePlan.joursEntrainement.notes || activePlan.joursRepos.notes) && (
          <div className="card p-5">
            <h3 className="section-title">Notes</h3>
            {activePlan.joursEntrainement.notes && (
              <div className="mb-3">
                <p className="text-xs text-zinc-500 mb-1">Entraînement :</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{activePlan.joursEntrainement.notes}</p>
              </div>
            )}
            {activePlan.joursRepos.notes && (
              <p className="text-xs text-zinc-500 mb-1">Repos :</p>
            )}
            {activePlan.joursRepos.notes && (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{activePlan.joursRepos.notes}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 border-t border-zinc-800">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ElevateLogo size={20} />
            <span className="text-gold font-semibold text-sm tracking-widest">ELEVATE FITNESS</span>
          </div>
          <p className="text-xs text-zinc-600">Ce plan est à titre indicatif. Consultez un professionnel de santé pour tout suivi médical.</p>
        </div>
      </div>
    </div>
  );
}

function DayRecapCard({
  title, dayPlan, targets, totals, validation, hydration
}: {
  title: string;
  dayPlan: DayPlan;
  targets: { targetKcal: number; proteinesG: number; glucidesG: number; lipidesG: number };
  totals: { proteines: number; glucides: number; lipides: number; kcal: number };
  validation: { status: 'ok' | 'warn' | 'error'; messages: string[] };
  hydration: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
        <StatusPill status={validation.status} />
      </div>

      {/* Food bank overview */}
      <div className="mb-4">
        <p className="section-title">Banque d'équivalents</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase">
                <th className="pb-2 text-left">Catégorie</th>
                <th className="pb-2 text-left">Aliment</th>
                <th className="pb-2 text-right">Portions</th>
                <th className="pb-2 text-right">P (g)</th>
                <th className="pb-2 text-right">G (g)</th>
                <th className="pb-2 text-right">L (g)</th>
                <th className="pb-2 text-right">kcal</th>
              </tr>
            </thead>
            <tbody>
              {FOOD_CATEGORIES.map(cat => {
                const item = getSelectedItem(dayPlan.foodBank, cat);
                const qty  = dayPlan.foodBank[cat as keyof typeof dayPlan.foodBank] as number;
                if (!item || qty === 0) return null;
                return (
                  <tr key={cat} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-400 text-xs">{CATEGORY_LABELS[cat]}</td>
                    <td className="py-2 text-zinc-300">{item.nom}</td>
                    <td className="py-2 text-right text-zinc-200">{qty}×</td>
                    <td className="py-2 text-right text-sky-300">{Math.round(item.proteines * qty)}</td>
                    <td className="py-2 text-right text-amber-300">{Math.round(item.glucides  * qty)}</td>
                    <td className="py-2 text-right text-rose-300">{Math.round(item.lipides   * qty)}</td>
                    <td className="py-2 text-right text-zinc-200">{Math.round(item.kcal * qty)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 font-semibold text-zinc-200">
                <td colSpan={3} className="pt-2">Total</td>
                <td className="pt-2 text-right text-sky-400">{totals.proteines}</td>
                <td className="pt-2 text-right text-amber-400">{totals.glucides}</td>
                <td className="pt-2 text-right text-rose-400">{totals.lipides}</td>
                <td className="pt-2 text-right">{totals.kcal}</td>
              </tr>
              <tr className="text-xs text-zinc-500">
                <td colSpan={3}>Objectif</td>
                <td className="text-right">{targets.proteinesG}</td>
                <td className="text-right">{targets.glucidesG}</td>
                <td className="text-right">{targets.lipidesG}</td>
                <td className="text-right">{targets.targetKcal}</td>
              </tr>
              <tr className="text-xs">
                <td colSpan={3} className="text-zinc-500">Écart</td>
                {([totals.proteines - targets.proteinesG, totals.glucides - targets.glucidesG,
                   totals.lipides - targets.lipidesG, totals.kcal - targets.targetKcal]).map((d, i) => (
                  <td key={i} className={`text-right ${d > 5 ? 'text-red-400' : d < -5 ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {d > 0 ? '+' : ''}{d}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Meal distribution */}
      <div className="mb-4">
        <p className="section-title">Répartition par repas</p>
        <div className="space-y-1">
          {MEAL_SLOTS.map(slot => {
            const mealData = dayPlan.meals[slot];
            if (mealData.portions.length === 0) return null;
            let p = 0, g = 0, l = 0, k = 0;
            mealData.portions.forEach(pt => {
              const item = getSelectedItem(dayPlan.foodBank, pt.category);
              if (item) { p += item.proteines * pt.portions; g += item.glucides * pt.portions; l += item.lipides * pt.portions; k += item.kcal * pt.portions; }
            });
            return (
              <div key={slot} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/50 text-xs">
                <span className="text-zinc-300 w-36 font-medium">{MEAL_SLOT_LABELS[slot]}</span>
                <span className="text-sky-400">{Math.round(p)}P</span>
                <span className="text-amber-400">{Math.round(g)}G</span>
                <span className="text-rose-400">{Math.round(l)}L</span>
                <span className="text-zinc-200 ml-auto">{Math.round(k)} kcal</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydration */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-900/10 border border-blue-900/30">
        <span className="text-xs text-zinc-400">Hydratation :</span>
        <span className="text-blue-300 font-semibold">{hydration} ml</span>
        <span className="text-zinc-500 text-xs">({(hydration / 1000).toFixed(1)} L)</span>
      </div>

      {/* Validation messages */}
      {validation.messages.length > 0 && (
        <div className="mt-3 space-y-1">
          {validation.messages.map((m, i) => (
            <p key={i} className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={11} /> {m}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

function TargetBlock({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-zinc-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: 'ok' | 'warn' | 'error' }) {
  if (status === 'ok')   return <span className="flex items-center gap-1 text-xs text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-900/30 border border-emerald-800"><CheckCircle  size={11} /> OK</span>;
  if (status === 'warn') return <span className="flex items-center gap-1 text-xs text-amber-400 px-2.5 py-1 rounded-full bg-amber-900/30 border border-amber-800"><AlertTriangle size={11} /> Attention</span>;
  return                        <span className="flex items-center gap-1 text-xs text-red-400   px-2.5 py-1 rounded-full bg-red-900/30   border border-red-800">  <AlertCircle  size={11} /> Hors cible</span>;
}
