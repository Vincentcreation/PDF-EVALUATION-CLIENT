import { useApp } from '../store/AppContext';
import {
  User, LayoutDashboard, Calendar, Sliders, FileText, ChevronRight
} from 'lucide-react';

const navItems = [
  { id: 'profil', label: 'Profil Athlète', icon: User },
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'planificateur', label: 'Planificateur', icon: Calendar },
  { id: 'macros', label: 'Distribution Macros', icon: Sliders },
  { id: 'recap', label: 'Récapitulatif', icon: FileText },
] as const;

export default function Sidebar() {
  const { page, setPage, activeProfile } = useApp();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">KR</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Bâtir un Plan</p>
            <p className="text-slate-400 text-xs">KR Kinetics × Elevate</p>
          </div>
        </div>
      </div>

      {activeProfile && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
          <p className="text-xs text-slate-400 mb-0.5">Athlète actif</p>
          <p className="text-sm font-medium text-slate-200 truncate">{activeProfile.nom}</p>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon size={17} />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} />}
            </button>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">© 2024 KR Kinetics</p>
        <p className="text-xs text-slate-600">v2.0</p>
      </div>
    </aside>
  );
}
