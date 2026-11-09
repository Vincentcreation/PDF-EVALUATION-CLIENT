import { useRef } from 'react';
import { useApp } from '../store/AppContext';
import {
  calculateTargetsForDay, calculateHydration, validatePlan,
  MACRO_PRESETS, ACTIVITY_LABELS, GOAL_LABELS,
  getWeightKg, getHeightCm,
} from '../utils/calculations';
import type { MacroPresetKey, NutritionalTargets, DayPlan } from '../types';
import {
  FOOD_CATEGORIES, CATEGORY_LABELS, MEAL_SLOT_LABELS, MEAL_SLOTS,
  PORTION_AVERAGES, computeBankTotals, computeMealTotals,
  isBankEmpty, areMealsEmpty,
} from '../utils/foodBank';
import type { ValidationResult } from '../utils/calculations';
import { FileDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import ElevateLogo from './ElevateLogo';

export default function RecapPage() {
  const { activeProfile, activePlan } = useApp();
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  if (!activeProfile || !activePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={36} className="text-zinc-600 mb-3" />
        <p className="text-zinc-400">Profil ou plan manquant.</p>
      </div>
    );
  }

  const macroDistrib = activePlan.macroDistribution ?? MACRO_PRESETS[activePlan.macroPreset as MacroPresetKey];

  // Day-specific targets (carb cycling for rest day)
  const trainingTargets = calculateTargetsForDay(
    activeProfile, macroDistrib, activePlan.goalType, 'entrainement',
    activePlan.proteinMode, activePlan.proteinGkg, activePlan.customKcal,
  );
  const reposTargets = calculateTargetsForDay(
    activeProfile, macroDistrib, activePlan.goalType, 'repos',
    activePlan.proteinMode, activePlan.proteinGkg, activePlan.customKcal,
  );

  const trainingTotals = computeBankTotals(activePlan.joursEntrainement.foodBank);
  const reposTotals    = computeBankTotals(activePlan.joursRepos.foodBank);

  const hydTraining = calculateHydration(
    trainingTotals.kcal, trainingTargets.targetKcal,
    activePlan.joursEntrainement.hydratation.manuel ?? 0,
  );
  const hydRepos = calculateHydration(
    reposTotals.kcal, reposTargets.targetKcal,
    activePlan.joursRepos.hydratation.manuel ?? 0,
  );

  const trainingValidation = validatePlan(
    trainingTotals.kcal, trainingTargets.targetKcal,
    trainingTotals.proteines, trainingTargets.proteinesG,
    trainingTotals.glucides,  trainingTargets.glucidesG,
    trainingTotals.lipides,   trainingTargets.lipidesG,
    isBankEmpty(activePlan.joursEntrainement.foodBank),
    areMealsEmpty(activePlan.joursEntrainement.meals),
  );
  const reposValidation = validatePlan(
    reposTotals.kcal, reposTargets.targetKcal,
    reposTotals.proteines, reposTargets.proteinesG,
    reposTotals.glucides,  reposTargets.glucidesG,
    reposTotals.lipides,   reposTargets.lipidesG,
    isBankEmpty(activePlan.joursRepos.foodBank),
    areMealsEmpty(activePlan.joursRepos.meals),
  );

  const weightKg = getWeightKg(activeProfile).toFixed(1);
  const heightCm = getHeightCm(activeProfile).toFixed(0);
  const dateStr  = new Date().toLocaleDateString('fr-CA');

  async function handleExportPDF() {
    if (!page1Ref.current || !page2Ref.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const opts = { scale: 2, backgroundColor: '#09090b', useCORS: true, logging: false };

      const [canvas1, canvas2] = await Promise.all([
        html2canvas(page1Ref.current!, opts),
        html2canvas(page2Ref.current!, opts),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw  = pdf.internal.pageSize.getWidth();
      const ph  = pdf.internal.pageSize.getHeight();

      function addPage(canvas: HTMLCanvasElement, addNewPage = false) {
        if (addNewPage) pdf.addPage();
        const imgW = pw;
        const imgH = (canvas.height / canvas.width) * pw;
        // If page is too tall, scale to fit
        const scale = imgH > ph ? ph / imgH : 1;
        pdf.addImage(
          canvas.toDataURL('image/png'), 'PNG',
          0, 0, imgW * scale, imgH * scale,
        );
      }

      addPage(canvas1);
      addPage(canvas2, true);

      pdf.save(`elevate-plan-${activeProfile!.nom.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erreur PDF — vérifiez la console.');
    }
  }

  const profileHeader = (
    <div className="mb-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <ElevateLogo size={36} />
          <div>
            <p className="text-gold font-bold tracking-wide">ELEVATE FITNESS</p>
            <p className="text-zinc-400 text-xs">Plan nutritionnel personnalisé</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Généré le</p>
          <p className="text-sm text-zinc-300">{dateStr}</p>
        </div>
      </div>
      <div className="border-t border-zinc-800 pt-4">
        <h2 className="text-xl font-bold text-zinc-100">{activeProfile.nom}</h2>
        <p className="text-gold text-sm mt-0.5">{activePlan.nom}</p>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
        <InfoBlock label="Sexe"         value={activeProfile.sexe === 'homme' ? 'Homme' : 'Femme'} />
        <InfoBlock label="Âge"          value={`${activeProfile.age} ans`} />
        <InfoBlock label="Poids"        value={`${weightKg} kg`} />
        <InfoBlock label="Taille"       value={`${heightCm} cm`} />
        <InfoBlock label="Activité"     value={ACTIVITY_LABELS[activeProfile.niveauActivite].split('(')[0].trim()} />
        <InfoBlock label="Objectif"     value={GOAL_LABELS[activePlan.goalType]} />
        <InfoBlock label="EER sédentaire" value={`${trainingTargets.bmr} kcal/j`} />
        <InfoBlock label="TDEE"         value={`${trainingTargets.tdee} kcal/j`} />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Actions */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Récapitulatif nutritionnel</h1>
          <p className="text-zinc-500 text-sm mt-1">Vue complète du plan alimentaire</p>
        </div>
        <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
          <FileDown size={15} /> Exporter PDF (2 pages A4)
        </button>
      </div>

      {/* On-screen summary */}
      <div className="card p-6">
        {profileHeader}
      </div>

      {/* Training day card */}
      <DayRecapCard
        title="Journée d'entraînement"
        dayPlan={activePlan.joursEntrainement}
        targets={trainingTargets}
        totals={trainingTotals}
        validation={trainingValidation}
        hydration={hydTraining.total}
      />

      {/* Rest day card */}
      <DayRecapCard
        title="Journée de repos (carb cycling actif)"
        dayPlan={activePlan.joursRepos}
        targets={reposTargets}
        totals={reposTotals}
        validation={reposValidation}
        hydration={hydRepos.total}
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
            <>
              <p className="text-xs text-zinc-500 mb-1">Repos :</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{activePlan.joursRepos.notes}</p>
            </>
          )}
        </div>
      )}

      {/* Hidden PDF pages (off-screen render) */}
      <div className="sr-only" aria-hidden>
        {/* Page 1: Training day */}
        <div ref={page1Ref} className="p-8 space-y-5" style={{ width: 794, background: '#09090b', color: '#e4e4e7' }}>
          <PdfHeader
            profile={{ nom: activeProfile.nom, planNom: activePlan.nom, sexe: activeProfile.sexe,
              age: activeProfile.age, poids: weightKg, taille: heightCm,
              activite: ACTIVITY_LABELS[activeProfile.niveauActivite].split('(')[0].trim(),
              objectif: GOAL_LABELS[activePlan.goalType], eerSed: trainingTargets.bmr, tdee: trainingTargets.tdee,
            }}
            date={dateStr}
          />
          <PdfDayPage
            title="Journée d'entraînement"
            dayPlan={activePlan.joursEntrainement}
            targets={trainingTargets}
            totals={trainingTotals}
            hydration={hydTraining.total}
          />
        </div>
        {/* Page 2: Rest day */}
        <div ref={page2Ref} className="p-8 space-y-5" style={{ width: 794, background: '#09090b', color: '#e4e4e7' }}>
          <PdfHeader
            profile={{ nom: activeProfile.nom, planNom: activePlan.nom, sexe: activeProfile.sexe,
              age: activeProfile.age, poids: weightKg, taille: heightCm,
              activite: ACTIVITY_LABELS[activeProfile.niveauActivite].split('(')[0].trim(),
              objectif: GOAL_LABELS[activePlan.goalType], eerSed: reposTargets.bmr, tdee: reposTargets.tdee,
            }}
            date={dateStr}
          />
          <PdfDayPage
            title="Journée de repos (carb cycling)"
            dayPlan={activePlan.joursRepos}
            targets={reposTargets}
            totals={reposTotals}
            hydration={hydRepos.total}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 border-t border-zinc-800">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ElevateLogo size={20} />
          <span className="text-gold font-semibold text-sm tracking-widest">ELEVATE FITNESS</span>
        </div>
        <p className="text-xs text-zinc-600">Ce plan est à titre indicatif. Consultez un professionnel de santé pour tout suivi médical.</p>
      </div>
    </div>
  );
}

// ─── PDF-specific sub-components ─────────────────────────────────────────────

function PdfHeader({ profile, date }: {
  profile: { nom: string; planNom: string; sexe: string; age: number; poids: string; taille: string;
    activite: string; objectif: string; eerSed: number; tdee: number; };
  date: string;
}) {
  return (
    <div style={{ borderBottom: '1px solid #3f3f46', paddingBottom: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ color: '#D4AF37', fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>ELEVATE FITNESS</div>
          <div style={{ color: '#71717a', fontSize: 11 }}>Plan nutritionnel personnalisé</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#a1a1aa' }}>{date}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5' }}>{profile.nom}</div>
      <div style={{ color: '#D4AF37', fontSize: 13, marginBottom: 10 }}>{profile.planNom}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 12 }}>
        {[
          ['Sexe', profile.sexe === 'homme' ? 'Homme' : 'Femme'],
          ['Âge', `${profile.age} ans`],
          ['Poids', `${profile.poids} kg`],
          ['Taille', `${profile.taille} cm`],
          ['Activité', profile.activite],
          ['Objectif', profile.objectif],
          ['EER sédentaire', `${profile.eerSed} kcal/j`],
          ['TDEE', `${profile.tdee} kcal/j`],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={{ color: '#71717a', fontSize: 10 }}>{l}</div>
            <div style={{ color: '#e4e4e7', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfDayPage({ title, dayPlan, targets, totals, hydration }: {
  title: string;
  dayPlan: DayPlan;
  targets: NutritionalTargets;
  totals: ReturnType<typeof computeBankTotals>;
  hydration: number;
}) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#D4AF37', marginBottom: 12 }}>{title}</div>

      {/* Targets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          ['Calories', `${targets.targetKcal} kcal`, '#D4AF37'],
          ['Protéines', `${targets.proteinesG} g`, '#38bdf8'],
          ['Glucides', `${targets.glucidesG} g`, '#fbbf24'],
          ['Lipides', `${targets.lipidesG} g`, '#f87171'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: '#18181b', borderRadius: 8, padding: 10 }}>
            <div style={{ color: c as string, fontWeight: 700, fontSize: 15 }}>{v}</div>
            <div style={{ color: '#71717a', fontSize: 11 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Food bank table */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Banque d'équivalents</div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #3f3f46', color: '#71717a', textAlign: 'left' }}>
              <th style={{ paddingBottom: 4 }}>Catégorie</th>
              <th style={{ paddingBottom: 4, textAlign: 'right' }}>Portions</th>
              <th style={{ paddingBottom: 4, textAlign: 'right' }}>P (g)</th>
              <th style={{ paddingBottom: 4, textAlign: 'right' }}>G (g)</th>
              <th style={{ paddingBottom: 4, textAlign: 'right' }}>L (g)</th>
              <th style={{ paddingBottom: 4, textAlign: 'right' }}>kcal</th>
            </tr>
          </thead>
          <tbody>
            {FOOD_CATEGORIES.map(cat => {
              const qty = dayPlan.foodBank[cat as keyof typeof dayPlan.foodBank] as number;
              if (!qty) return null;
              const avg = PORTION_AVERAGES[cat];
              return (
                <tr key={cat} style={{ borderBottom: '1px solid #27272a' }}>
                  <td style={{ padding: '4px 0', color: '#a1a1aa' }}>{CATEGORY_LABELS[cat]}</td>
                  <td style={{ textAlign: 'right', color: '#e4e4e7' }}>{qty}×</td>
                  <td style={{ textAlign: 'right', color: '#38bdf8' }}>{Math.round(avg.p * qty)}</td>
                  <td style={{ textAlign: 'right', color: '#fbbf24' }}>{Math.round(avg.g * qty)}</td>
                  <td style={{ textAlign: 'right', color: '#f87171' }}>{Math.round(avg.l * qty)}</td>
                  <td style={{ textAlign: 'right', color: '#e4e4e7' }}>{Math.round(avg.kcal * qty)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid #52525b', fontWeight: 700, color: '#e4e4e7' }}>
              <td style={{ paddingTop: 4 }}>Total</td>
              <td />
              <td style={{ textAlign: 'right', color: '#38bdf8' }}>{totals.proteines}</td>
              <td style={{ textAlign: 'right', color: '#fbbf24' }}>{totals.glucides}</td>
              <td style={{ textAlign: 'right', color: '#f87171' }}>{totals.lipides}</td>
              <td style={{ textAlign: 'right' }}>{totals.kcal}</td>
            </tr>
            <tr style={{ color: '#71717a', fontSize: 11 }}>
              <td>Objectif</td>
              <td />
              <td style={{ textAlign: 'right' }}>{targets.proteinesG}</td>
              <td style={{ textAlign: 'right' }}>{targets.glucidesG}</td>
              <td style={{ textAlign: 'right' }}>{targets.lipidesG}</td>
              <td style={{ textAlign: 'right' }}>{targets.targetKcal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Meal distribution */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Répartition par repas</div>
        {MEAL_SLOTS.map(slot => {
          const meal = dayPlan.meals[slot];
          if (!meal.portions.length) return null;
          const t = computeMealTotals(meal.portions);
          return (
            <div key={slot} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid #27272a', fontSize: 12 }}>
              <span style={{ color: '#e4e4e7', width: 130, fontWeight: 600 }}>{MEAL_SLOT_LABELS[slot]}</span>
              <span style={{ color: '#38bdf8' }}>{t.proteines}P</span>
              <span style={{ color: '#fbbf24' }}>{t.glucides}G</span>
              <span style={{ color: '#f87171' }}>{t.lipides}L</span>
              <span style={{ marginLeft: 'auto', color: '#e4e4e7', fontWeight: 600 }}>{t.kcal} kcal</span>
            </div>
          );
        })}
      </div>

      {/* Hydration */}
      <div style={{ background: '#172554', borderRadius: 8, padding: 10, fontSize: 12 }}>
        <span style={{ color: '#93c5fd' }}>Hydratation : </span>
        <span style={{ color: '#bfdbfe', fontWeight: 700 }}>{(hydration / 1000).toFixed(1)} L</span>
        <span style={{ color: '#3b82f6' }}> ({hydration} ml)</span>
      </div>
    </div>
  );
}

// ─── On-screen day recap card ─────────────────────────────────────────────────

function DayRecapCard({ title, dayPlan, targets, totals, validation, hydration }: {
  title: string;
  dayPlan: DayPlan;
  targets: NutritionalTargets;
  totals: ReturnType<typeof computeBankTotals>;
  validation: ValidationResult;
  hydration: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
        <StatusPill status={validation.status} />
      </div>

      {/* Caloric targets */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="text-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <p className="text-gold font-bold text-lg">{targets.targetKcal.toLocaleString('fr-CA')}</p>
          <p className="text-xs text-zinc-500">kcal</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <p className="text-sky-400 font-bold text-lg">{targets.proteinesG}g</p>
          <p className="text-xs text-zinc-500">Protéines</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <p className="text-amber-400 font-bold text-lg">{targets.glucidesG}g</p>
          <p className="text-xs text-zinc-500">Glucides</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <p className="text-rose-400 font-bold text-lg">{targets.lipidesG}g</p>
          <p className="text-xs text-zinc-500">Lipides</p>
        </div>
      </div>

      {/* Food bank table — PORTION_AVERAGES values */}
      <div className="mb-5">
        <p className="section-title">Banque d'équivalents</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase">
                <th className="pb-2 text-left">Catégorie</th>
                <th className="pb-2 text-right">Portions</th>
                <th className="pb-2 text-right">P (g)</th>
                <th className="pb-2 text-right">G (g)</th>
                <th className="pb-2 text-right">L (g)</th>
                <th className="pb-2 text-right">kcal</th>
              </tr>
            </thead>
            <tbody>
              {FOOD_CATEGORIES.map(cat => {
                const qty = dayPlan.foodBank[cat as keyof typeof dayPlan.foodBank] as number;
                if (!qty) return null;
                const avg = PORTION_AVERAGES[cat];
                return (
                  <tr key={cat} className="border-b border-zinc-800/50">
                    <td className="py-2 text-zinc-400 text-xs">{CATEGORY_LABELS[cat]}</td>
                    <td className="py-2 text-right text-zinc-200">{qty}×</td>
                    <td className="py-2 text-right text-sky-300">{Math.round(avg.p * qty)}</td>
                    <td className="py-2 text-right text-amber-300">{Math.round(avg.g * qty)}</td>
                    <td className="py-2 text-right text-rose-300">{Math.round(avg.l * qty)}</td>
                    <td className="py-2 text-right text-zinc-200">{Math.round(avg.kcal * qty)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 font-semibold text-zinc-200">
                <td className="pt-2" colSpan={2}>Total</td>
                <td className="pt-2 text-right text-sky-400">{totals.proteines}</td>
                <td className="pt-2 text-right text-amber-400">{totals.glucides}</td>
                <td className="pt-2 text-right text-rose-400">{totals.lipides}</td>
                <td className="pt-2 text-right">{totals.kcal}</td>
              </tr>
              <tr className="text-xs text-zinc-500">
                <td colSpan={2}>Objectif</td>
                <td className="text-right">{targets.proteinesG}</td>
                <td className="text-right">{targets.glucidesG}</td>
                <td className="text-right">{targets.lipidesG}</td>
                <td className="text-right">{targets.targetKcal}</td>
              </tr>
              <tr className="text-xs">
                <td colSpan={2} className="text-zinc-500">Écart</td>
                {[
                  totals.proteines - targets.proteinesG,
                  totals.glucides  - targets.glucidesG,
                  totals.lipides   - targets.lipidesG,
                  totals.kcal      - targets.targetKcal,
                ].map((d, i) => (
                  <td key={i} className={`text-right ${Math.abs(d) <= 5 ? 'text-emerald-400' : d > 0 ? 'text-red-400' : 'text-sky-400'}`}>
                    {d > 0 ? '+' : ''}{d}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Meal distribution — using PORTION_AVERAGES for consistency */}
      <div className="mb-5">
        <p className="section-title">Répartition par repas</p>
        <div className="space-y-1">
          {MEAL_SLOTS.map(slot => {
            const mealData = dayPlan.meals[slot];
            if (!mealData.portions.length) return null;
            const t = computeMealTotals(mealData.portions);
            return (
              <div key={slot} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/50 text-xs">
                <span className="text-zinc-300 w-36 font-medium">{MEAL_SLOT_LABELS[slot]}</span>
                <span className="text-sky-400">{t.proteines}P</span>
                <span className="text-amber-400">{t.glucides}G</span>
                <span className="text-rose-400">{t.lipides}L</span>
                <span className="text-zinc-200 ml-auto font-medium">{t.kcal} kcal</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hydration */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-900/10 border border-blue-900/30 mb-3">
        <span className="text-xs text-zinc-400">Hydratation :</span>
        <span className="text-blue-300 font-semibold">{(hydration / 1000).toFixed(1)} L</span>
        <span className="text-zinc-500 text-xs">({hydration} ml)</span>
      </div>

      {/* Validation */}
      {validation.messages.length > 0 && (
        <div className="space-y-1">
          {validation.messages.map((m, i) => (
            <p key={i} className={`text-xs flex items-center gap-1.5 ${validation.status === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
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

function StatusPill({ status }: { status: 'ok' | 'warn' | 'error' }) {
  if (status === 'ok')   return <span className="flex items-center gap-1 text-xs text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-900/30 border border-emerald-800"><CheckCircle  size={11} /> OK</span>;
  if (status === 'warn') return <span className="flex items-center gap-1 text-xs text-amber-400   px-2.5 py-1 rounded-full bg-amber-900/30   border border-amber-800"><AlertTriangle size={11} /> Attention</span>;
  return                        <span className="flex items-center gap-1 text-xs text-red-400     px-2.5 py-1 rounded-full bg-red-900/30     border border-red-800">  <AlertCircle  size={11} /> Hors cible</span>;
}
