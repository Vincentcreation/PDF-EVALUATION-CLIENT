import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import type { Profile, Sex, WeightUnit, HeightUnit, ActivityLevel } from '../types';
import { v4 } from '../utils/uuid';
import { ACTIVITY_LABELS } from '../utils/calculations';
import { exportAllData, importAllData } from '../utils/storage';
import { User, Plus, Trash2, Download, Upload, ChevronDown, Edit2 } from 'lucide-react';

function emptyProfile(): Profile {
  return {
    id: v4(), nom: '', sexe: 'homme', age: 25,
    poids: 75, unitePoids: 'kg',
    taille: 175, uniteHauteur: 'cm', taillepieds: 5, taillePouces: 9,
    niveauActivite: 'modere',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export default function ProfilPage() {
  const { profiles, activeProfile, saveProfileAndSelect, removeProfile, selectProfile } = useApp();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  function startNew() { setEditing(emptyProfile()); setShowForm(true); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    saveProfileAndSelect({ ...editing, updatedAt: new Date().toISOString() });
    setEditing(null);
    setShowForm(false);
  }

  function handleExport() {
    const blob = new Blob([exportAllData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevate-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = importAllData(ev.target?.result as string);
        const warn = result.warnings.length ? ` ⚠️ ${result.warnings.join('; ')}` : '';
        setImportMsg({ type: 'ok', text: `Importé: ${result.profiles} profil(s), ${result.plans} plan(s).${warn}` });
      } catch (err) {
        setImportMsg({ type: 'error', text: `Erreur d'import: ${err instanceof Error ? err.message : 'fichier invalide'}` });
      }
      setTimeout(() => setImportMsg(null), 6000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const form = editing;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Profil Athlète</h1>
          <p className="text-zinc-500 text-sm mt-1">Informations personnelles et préférences</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-sm transition-colors">
            <Download size={14} /> Exporter
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-sm transition-colors">
            <Upload size={14} /> Importer
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={startNew} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> Nouveau profil
          </button>
        </div>
      </div>

      {/* Import feedback */}
      {importMsg && (
        <div className={`p-3 rounded-xl border text-sm ${
          importMsg.type === 'ok'
            ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
            : 'bg-red-900/30 border-red-700/50 text-red-300'
        }`}>{importMsg.text}</div>
      )}

      {/* Profile list */}
      {profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map(p => (
            <div
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className={`card p-4 cursor-pointer transition-all hover:border-gold/40 ${
                activeProfile?.id === p.id ? 'border-gold/60 bg-gold/5' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                    <User size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100">{p.nom || 'Sans nom'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {p.sexe === 'homme' ? 'Homme' : 'Femme'} · {p.age} ans · {p.poids} {p.unitePoids}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); setEditing({ ...p }); setShowForm(true); }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-gold hover:bg-zinc-800 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ce profil ?')) removeProfile(p.id); }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {activeProfile?.id === p.id && (
                <span className="mt-2 inline-block text-xs text-gold font-medium px-2 py-0.5 bg-gold/10 rounded-full">Actif</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && form && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-zinc-100 mb-5">
            {profiles.find(p => p.id === form.id) ? 'Modifier le profil' : 'Nouveau profil'}
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            {/* Name + Sex */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom / Prénom">
                <input type="text" value={form.nom}
                  onChange={e => setEditing({ ...form, nom: e.target.value })}
                  placeholder="Ex: Marie Tremblay" className="input-field" required />
              </Field>
              <Field label="Sexe">
                <div className="flex gap-2">
                  {(['homme', 'femme'] as Sex[]).map(s => (
                    <button key={s} type="button"
                      onClick={() => setEditing({ ...form, sexe: s })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.sexe === s ? 'bg-gold/10 border-gold/50 text-gold' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}>
                      {s === 'homme' ? 'Homme' : 'Femme'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Age + Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Âge (ans)">
                <input type="number" min={10} max={100} value={form.age}
                  onChange={e => setEditing({ ...form, age: +e.target.value })}
                  className="input-field" />
              </Field>
              <Field label="Poids">
                <div className="flex gap-2">
                  <input type="number" min={20} max={500} step={0.1} value={form.poids}
                    onChange={e => setEditing({ ...form, poids: +e.target.value })}
                    className="input-field flex-1" />
                  <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
                    {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                      <button key={u} type="button"
                        onClick={() => setEditing({ ...form, unitePoids: u })}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${form.unitePoids === u ? 'bg-gold/10 text-gold' : 'bg-zinc-800 text-zinc-400'}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
            </div>

            {/* Height */}
            <Field label="Taille">
              <div className="space-y-2">
                <div className="flex rounded-lg border border-zinc-700 overflow-hidden w-fit">
                  {(['cm', 'ft'] as HeightUnit[]).map(u => (
                    <button key={u} type="button"
                      onClick={() => setEditing({ ...form, uniteHauteur: u })}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${form.uniteHauteur === u ? 'bg-gold/10 text-gold' : 'bg-zinc-800 text-zinc-400'}`}>
                      {u === 'cm' ? 'Centimètres' : 'Pieds / Pouces'}
                    </button>
                  ))}
                </div>
                {form.uniteHauteur === 'cm' ? (
                  <input type="number" min={100} max={250} step={0.5} value={form.taille}
                    onChange={e => setEditing({ ...form, taille: +e.target.value })}
                    placeholder="175 cm" className="input-field" />
                ) : (
                  <div className="flex gap-2 items-center">
                    <input type="number" min={3} max={8} value={form.taillepieds}
                      onChange={e => setEditing({ ...form, taillepieds: +e.target.value })}
                      className="input-field w-24" />
                    <span className="text-zinc-400 text-sm">pi</span>
                    <input type="number" min={0} max={11} value={form.taillePouces}
                      onChange={e => setEditing({ ...form, taillePouces: +e.target.value })}
                      className="input-field w-24" />
                    <span className="text-zinc-400 text-sm">po</span>
                  </div>
                )}
              </div>
            </Field>

            {/* Activity */}
            <Field label="Niveau d'activité physique">
              <div className="relative">
                <select value={form.niveauActivite}
                  onChange={e => setEditing({ ...form, niveauActivite: e.target.value as ActivityLevel })}
                  className="input-field appearance-none pr-8">
                  {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">Enregistrer</button>
              <button type="button" onClick={() => { setEditing(null); setShowForm(false); }} className="btn-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {profiles.length === 0 && !showForm && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-gold" />
          </div>
          <p className="text-zinc-400 mb-4">Aucun profil créé.</p>
          <button onClick={startNew} className="btn-primary">Créer votre premier profil</button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
