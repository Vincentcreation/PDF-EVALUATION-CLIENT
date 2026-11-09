import { useApp } from '../store/AppContext';
import { User, LayoutDashboard, Calendar, Sliders, FileText, ChevronRight } from 'lucide-react';
import ElevateLogo from './ElevateLogo';

const navItems = [
  { id: 'profil',        label: 'Profil Athlète',       icon: User },
  { id: 'dashboard',     label: 'Tableau de bord',       icon: LayoutDashboard },
  { id: 'planificateur', label: 'Planificateur',         icon: Calendar },
  { id: 'macros',        label: 'Distribution Macros',   icon: Sliders },
  { id: 'recap',         label: 'Récapitulatif',         icon: FileText },
] as const;

export default function Sidebar() {
  const { page, setPage, activeProfile } = useApp();

  return (
    <aside className="w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <ElevateLogo size={36} />
          <div>
            <p className="text-gold font-bold text-base leading-tight tracking-wide">ELEVATE</p>
            <p className="text-zinc-400 text-xs tracking-widest uppercase">Fitness</p>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-2">Bâtir un Plan 2.0</p>
      </div>

      {/* Active profile */}
      {activeProfile && (
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <p className="text-xs text-zinc-500 mb-0.5">Athlète actif</p>
          <p className="text-sm font-semibold text-zinc-100 truncate">{activeProfile.nom}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-gold/10 text-gold border border-gold/30 shadow-gold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={13} className="text-gold" />}
            </button>
          );
        })}
      </nav>

      {/* Mountain silhouette footer */}
      <div className="px-5 pb-4">
        <svg viewBox="0 0 200 40" className="w-full opacity-20 mb-3" preserveAspectRatio="none">
          <polygon points="0,40 30,10 60,25 90,5 120,20 150,8 180,22 200,12 200,40" fill="#D4AF37" />
        </svg>
        <p className="text-xs text-zinc-600">© 2024 Elevate Fitness</p>
        <p className="text-xs text-zinc-700">v2.0</p>
      </div>
    </aside>
  );
}
