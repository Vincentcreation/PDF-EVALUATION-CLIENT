import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import type { Profile, Sex, WeightUnit, HeightUnit, ActivityLevel } from '../types';
import { v4 } from '../utils/uuid';
import { ACTIVITY_LABELS } from '../utils/calculations';
import { exportAllData, importAllData } from '../utils/storage';
import { User, Plus, Trash2, Download, Upload, ChevronDown } from 'lucide-react';

function emptyProfile(): Profile {
  return {
    id: v4(),
    nom: '',
    sexe: 'homme',
    age: 25,
    poids: 75,
    unitePoids: 'kg',
    taille: 175,
    uniteHauteur: 'cm',
    taillepieds: 5,
    taillePouces: 9,
    niveauActivite: 'modere',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ProfilPage() {
  const { profiles, activeProfile, saveProfileAndSelect, removeProfile, selectProfile } = useApp();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [showNew, setShowNew] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  function startNew() {
    setEditing(emptyProfile());
    setShowNew(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const updated = { ...editing, updatedAt: new Date().toISOString() };
    saveProfileAndSelect(updated);
    setEditing(null);
    setShowNew(false);
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batir-un-plan-export-${new Date().toISOString().slice(0, 10)}.json`;
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
        setImportMsg(`Importé: ${result.profiles} profil(s), ${result.plans} plan(s)`);
        setTimeout(() => setImportMsg(''), 4000);
      } catch {
        setImportMsg('Erreur lors de l\'import');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  const form = editing;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profil Athlète</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez les profils et informations de base</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm transition-colors">
            <Download size={15} /> Exporter
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm transition-colors">
            <Upload size={15} /> Importer
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={startNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 text-sm font-medium transition-colors">
            <Plus size={15} /> Nouveau profil
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="p-3 rounded-lg bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm">{importMsg}</div>
      )}

      {profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map(p => (
            <div
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeProfile?.id === p.id
                  ? 'border-sky-500 bg-sky-900/20'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{p.nom || 'Sans nom'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.sexe === 'homme' ? 'Homme' : 'Femme'} · {p.age} ans · {p.poids} {p.unitePoids}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing({ ...p }); setShowNew(true); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Supprimer ce profil ?')) removeProfile(p.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {activeProfile?.id === p.id && (
                <span className="mt-2 inline-block text-xs text-sky-400 font-medium">· Actif</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && form && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
          <h2 className="text-lg font-semibold text-white mb-5">
            {profiles.find(p => p.id === form.id) ? 'Modifier le profil' : 'Nouveau profil'}
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nom / Prénom">
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setEditing({ ...form, nom: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                  className="input-field"
                  required
                />
              </Field>
              <Field label="Sexe">
                <div className="flex gap-2">
                  {(['homme', 'femme'] as Sex[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing({ ...form, sexe: s })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.sexe === s
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {s === 'homme' ? 'Homme' : 'Femme'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Âge (ans)">
                <input
                  type="number"
                  min={10} max={100}
                  value={form.age}
                  onChange={e => setEditing({ ...form, age: +e.target.value })}
                  className="input-field"
                />
              </Field>
              <Field label="Poids">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={20} max={500} step={0.1}
                    value={form.poids}
                    onChange={e => setEditing({ ...form, poids: +e.target.value })}
                    className="input-field flex-1"
                  />
                  <div className="flex rounded-lg border border-slate-600 overflow-hidden">
                    {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setEditing({ ...form, unitePoids: u })}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          form.unitePoids === u ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
            </div>

            <Field label="Taille">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex rounded-lg border border-slate-600 overflow-hidden">
                    {(['cm', 'ft'] as HeightUnit[]).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setEditing({ ...form, uniteHauteur: u })}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          form.uniteHauteur === u ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {u === 'cm' ? 'cm' : 'pi/po'}
                      </button>
                    ))}
                  </div>
                </div>
                {form.uniteHauteur === 'cm' ? (
                  <input
                    type="number"
                    min={100} max={250} step={0.5}
                    value={form.taille}
                    onChange={e => setEditing({ ...form, taille: +e.target.value })}
                    placeholder="175"
                    className="input-field"
                  />
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={3} max={8}
                      value={form.taillepieds}
                      onChange={e => setEditing({ ...form, taillepieds: +e.target.value })}
                      className="input-field w-24"
                      placeholder="Pieds"
                    />
                    <span className="text-slate-400 text-sm">pi</span>
                    <input
                      type="number"
                      min={0} max={11}
                      value={form.taillePouces}
                      onChange={e => setEditing({ ...form, taillePouces: +e.target.value })}
                      className="input-field w-24"
                      placeholder="Pouces"
                    />
                    <span className="text-slate-400 text-sm">po</span>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Niveau d'activité physique">
              <div className="relative">
                <select
                  value={form.niveauActivite}
                  onChange={e => setEditing({ ...form, niveauActivite: e.target.value as ActivityLevel })}
                  className="input-field appearance-none pr-8 w-full"
                >
                  {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors">
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => { setEditing(null); setShowNew(false); }}
                className="px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium text-sm transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {profiles.length === 0 && !showNew && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 mb-4">Aucun profil créé.</p>
          <button onClick={startNew} className="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-medium text-sm hover:bg-sky-500 transition-colors">
            Créer votre premier profil
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
