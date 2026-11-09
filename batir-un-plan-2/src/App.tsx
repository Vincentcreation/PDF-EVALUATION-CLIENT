import { AppProvider, useApp } from './store/AppContext';
import Sidebar from './components/Sidebar';
import ProfilPage from './components/ProfilPage';
import DashboardPage from './components/DashboardPage';
import PlanificateurPage from './components/PlanificateurPage';
import MacrosPage from './components/MacrosPage';
import RecapPage from './components/RecapPage';

function PageRouter() {
  const { page } = useApp();
  switch (page) {
    case 'profil':        return <ProfilPage />;
    case 'dashboard':     return <DashboardPage />;
    case 'planificateur': return <PlanificateurPage />;
    case 'macros':        return <MacrosPage />;
    case 'recap':         return <RecapPage />;
    default:              return <ProfilPage />;
  }
}

function Layout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin bg-zinc-950">
        <div className="p-5 md:p-8 max-h-screen">
          <PageRouter />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
