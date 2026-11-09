import { useRef } from 'react';
import { useApp } from '../store/AppContext';
import {
  calculateTargets, calculateDayTotals, evaluatePlanStatus,
  MACRO_PRESETS, ACTIVITY_LABELS,
  getWeightKg, getHeightCm,
} from '../utils/calculations';
import type { MacroPresetKey } from '../utils/calculations';
import type { DayPlan } from '../types';
import { FileDown, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function RecapPage() {
  const { activeProfile, activePlan } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!activeProfile || !activePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={36} className="text-slate-500 mb-3" />
        <p className="text-slate-400">Profil ou plan manquant. Configurez d'abord le profil et le plan.</p>
      </div>
    );
  }

  const macroDistrib = activePlan.macroDistribution ?? MACRO_PRESETS[activePlan.macroPreset as MacroPresetKey];
  const targets = calculateTargets(activeProfile, macroDistrib, activePlan.goalType, activePlan.customKcal);

  const trainingTotals = calculateDayTotals(activePlan.joursEntrainement);
  const reposTotals = calculateDayTotals(activePlan.joursRepos);

  const trainingStatus = evaluatePlanStatus(trainingTotals, targets);
  const reposStatus = evaluatePlanStatus(reposTotals, targets);

  const weightKg = getWeightKg(activeProfile).toFixed(1);
  const heightCm = getHeightCm(activeProfile).toFixed(0);

  async function handleExportPDF() {
    if (!printRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPos = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        yPos -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`plan-${activeProfile!.nom.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Erreur lors de la génération du PDF.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Récapitulatif nutritionnel</h1>
          <p className="text-slate-400 text-sm mt-1">Vue complète du plan alimentaire</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 transition-colors"
        >
          <FileDown size={16} /> Exporter PDF
        </button>
      </div>

      <div ref={printRef} className="space-y-5">
        <div className="p-6 rounded-2xl border border-slate-700 bg-slate-800/60">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{activeProfile.nom}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{activePlan.nom}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Généré le</p>
              <p className="text-sm text-slate-300">{new Date().toLocaleDateString('fr-CA')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <InfoItem label="Sexe" value={activeProfile.sexe === 'homme' ? 'Homme' : 'Femme'} />
            <InfoItem label="Âge" value={`${activeProfile.age} ans`} />
            <InfoItem label="Poids" value={`${weightKg} kg`} />
            <InfoItem label="Taille" value={`${heightCm} cm`} />
            <InfoItem label="Niveau activité" value={ACTIVITY_LABELS[activeProfile.niveauActivite].split('(')[0].trim()} />
            <InfoItem label="BMR" value={`${targets.bmr} kcal/j`} />
            <InfoItem label="TDEE" value={`${targets.tdee} kcal/j`} />
            <InfoItem label="Objectif" value={`${targets.targetKcal} kcal/j`} />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Objectifs macros</h3>
          <div className="grid grid-cols-3 gap-4">
            <MacroBlock label="Protéines" g={targets.proteinesG} pct={macroDistrib.proteines} color="sky" />
            <MacroBlock label="Glucides" g={targets.glucidesG} pct={macroDistrib.glucides} color="amber" />
            <MacroBlock label="Lipides" g={targets.lipidesG} pct={macroDistrib.lipides} color="rose" />
          </div>
        </div>

        <DayRecap
          title="Jour d'entraînement"
          dayPlan={activePlan.joursEntrainement}
          totals={trainingTotals}
          targets={targets}
          status={trainingStatus}
        />
        <DayRecap
          title="Jour de repos"
          dayPlan={activePlan.joursRepos}
          totals={reposTotals}
          targets={targets}
          status={reposStatus}
        />

        {(activePlan.joursEntrainement.notes || activePlan.joursRepos.notes) && (
          <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Notes</h3>
            {activePlan.joursEntrainement.notes && (
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1">Jour d'entraînement :</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{activePlan.joursEntrainement.notes}</p>
              </div>
            )}
            {activePlan.joursRepos.notes && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Jour de repos :</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{activePlan.joursRepos.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-center py-4 text-xs text-slate-500">
          <p>KR Kinetics × Elevate Fitness — Bâtir un Plan 2.0</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}

function MacroBlock({ label, g, pct, color }: { label: string; g: number; pct: number; color: string }) {
  const colorMap: Record<string, string> = {
    sky: 'text-sky-400 border-sky-700/50 bg-sky-900/20',
    amber: 'text-amber-400 border-amber-700/50 bg-amber-900/20',
    rose: 'text-rose-400 border-rose-700/50 bg-rose-900/20',
  };
  return (
    <div className={`p-4 rounded-xl border text-center ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{g}g</p>
      <p className="text-xs opacity-80 mt-1">{label}</p>
      <p className="text-xs opacity-60">{pct}% des kcal</p>
    </div>
  );
}

function DayRecap({
  title, dayPlan, totals, targets, status
}: {
  title: string;
  dayPlan: DayPlan;
  totals: { proteines: number; glucides: number; lipides: number; kcal: number };
  targets: { targetKcal: number; proteinesG: number; glucidesG: number; lipidesG: number };
  status: 'ok' | 'warn' | 'error';
}) {
  const TIMING_LABELS: Record<string, string> = {
    pre: 'Pré-entraînement',
    post: 'Post-entraînement',
    normal: 'Normal',
  };

  return (
    <div className="p-5 rounded-2xl border border-slate-700 bg-slate-800/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <StatusPill status={status} />
      </div>

      {dayPlan.repas.length === 0 ? (
        <p className="text-sm text-slate-500 italic">Aucun repas planifié</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs text-slate-500 uppercase">
                <th className="pb-2 text-left">Repas</th>
                <th className="pb-2 text-left">Timing</th>
                <th className="pb-2 text-right">P (g)</th>
                <th className="pb-2 text-right">G (g)</th>
                <th className="pb-2 text-right">L (g)</th>
                <th className="pb-2 text-right">kcal</th>
              </tr>
            </thead>
            <tbody>
              {dayPlan.repas.map(r => {
                const kcal = r.manualKcal ? r.kcal : Math.round(r.proteines * 4 + r.glucides * 4 + r.lipides * 9);
                return (
                  <tr key={r.id} className="border-b border-slate-700/50">
                    <td className="py-2 text-slate-300">{r.nom}</td>
                    <td className="py-2 text-slate-400 text-xs">{TIMING_LABELS[r.timing]}</td>
                    <td className="py-2 text-right text-sky-300">{r.proteines}</td>
                    <td className="py-2 text-right text-amber-300">{r.glucides}</td>
                    <td className="py-2 text-right text-rose-300">{r.lipides}</td>
                    <td className="py-2 text-right text-slate-200">{kcal}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold text-slate-200 border-t border-slate-600">
                <td className="pt-2" colSpan={2}>Total</td>
                <td className="pt-2 text-right text-sky-400">{Math.round(totals.proteines)}</td>
                <td className="pt-2 text-right text-amber-400">{Math.round(totals.glucides)}</td>
                <td className="pt-2 text-right text-rose-400">{Math.round(totals.lipides)}</td>
                <td className="pt-2 text-right">{Math.round(totals.kcal)}</td>
              </tr>
              <tr className="text-xs text-slate-500">
                <td colSpan={2}>Objectif</td>
                <td className="text-right">{targets.proteinesG}</td>
                <td className="text-right">{targets.glucidesG}</td>
                <td className="text-right">{targets.lipidesG}</td>
                <td className="text-right">{targets.targetKcal}</td>
              </tr>
              <tr className="text-xs">
                <td colSpan={2} className="text-slate-500">Écart</td>
                {[
                  Math.round(totals.proteines) - targets.proteinesG,
                  Math.round(totals.glucides) - targets.glucidesG,
                  Math.round(totals.lipides) - targets.lipidesG,
                  Math.round(totals.kcal) - targets.targetKcal,
                ].map((diff, i) => (
                  <td key={i} className={`text-right ${diff > 0 ? 'text-rose-400' : diff < 0 ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: 'ok' | 'warn' | 'error' }) {
  if (status === 'ok') return <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle size={12} /> OK</span>;
  if (status === 'warn') return <span className="flex items-center gap-1 text-xs text-amber-400"><AlertTriangle size={12} /> Attention</span>;
  return <span className="flex items-center gap-1 text-xs text-rose-400"><AlertCircle size={12} /> Hors cible</span>;
}
