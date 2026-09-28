import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './lib/i18n';
import { AuthProvider, useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import DogsPage from './pages/DogsPage';
import CowsPage from './pages/CowsPage';
import AnimalModal from './components/AnimalModal';
import AnimalForm from './components/AnimalForm';
import MobileSimulatorModal from './components/MobileSimulatorModal';
import SettingsModal from './components/SettingsModal';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import {
  fetchAnimals,
  getDashboardStats,
  createAnimal,
  updateAnimal,
  deleteAnimal
} from './lib/api';

function MainApp() {
  const { t } = useTranslation();
  const { currentUser, isAdmin, isAuthenticated } = useAuth();

  // If user is not logged in, show the sleek Login Page!
  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'dogs', 'cows'
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({
    totalDogs: 0,
    totalCows: 0,
    totalAnimals: 0,
    underTreatmentTotal: 0,
    underTreatmentDogs: 0,
    underTreatmentCows: 0,
    recoveredTotal: 0,
    recoveredDogs: 0,
    recoveredCows: 0,
    recoveryRate: 0,
    recentDogs: [],
    recentCows: [],
    allAnimals: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [addingType, setAddingType] = useState(null); // 'dog' or 'cow' or null
  const [isMobileSimOpen, setIsMobileSimOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncNotice, setSyncNotice] = useState(null);

  useEffect(() => {
    const handleSyncStatus = (e) => {
      if (e.detail) {
        setSyncNotice(e.detail);
      }
    };
    window.addEventListener('jjv:cloud-sync', handleSyncStatus);
    return () => window.removeEventListener('jjv:cloud-sync', handleSyncStatus);
  }, []);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = setTimeout(() => {
      setSyncNotice(null);
    }, syncNotice.type === 'error' ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [syncNotice]);

  // Load all animals and stats
  const refreshData = async () => {
    try {
      setIsLoading(true);
      const all = await fetchAnimals();
      setAnimals(all);
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Failed to load animals data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSaveAnimal = async (formData, existingId = null) => {
    if (existingId) {
      await updateAnimal(existingId, formData);
    } else {
      await createAnimal(formData, currentUser);
    }
    await refreshData();
    setEditingAnimal(null);
    setAddingType(null);
  };

  const handleDeleteAnimal = async (id) => {
    if (!isAdmin) {
      alert('Only administrators can delete animal records.');
      return;
    }
    await deleteAnimal(id, currentUser);
    await refreshData();
    if (selectedAnimal?.id === id) {
      setSelectedAnimal(null);
    }
  };

  const dogs = animals.filter((a) => a.animal_type === 'dog');
  const cows = animals.filter((a) => a.animal_type === 'cow');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setAddingType(null);
          setEditingAnimal(null);
          setActiveTab(tab);
        }}
        openMobileSimulator={() => setIsMobileSimOpen(true)}
        openSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <ErrorBoundary scope="section">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-[#6b94b8]/20 border-t-[#6b94b8] rounded-full animate-spin"></div>
              <p className="text-xs text-muted">Loading Jeev Jantu Vihar census records...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  stats={stats}
                  onNavigate={(page) => setActiveTab(page)}
                  onViewDetail={(animal) => setSelectedAnimal(animal)}
                  onAddNew={(type) => {
                    if (type === 'dog') setActiveTab('dogs');
                    if (type === 'cow') setActiveTab('cows');
                  }}
                />
              )}

              {activeTab === 'dogs' && (
                <DogsPage
                  dogs={dogs}
                  onBackToDashboard={() => {
                    setEditingAnimal(null);
                    setActiveTab('dashboard');
                  }}
                  onViewDetail={(animal) => setSelectedAnimal(animal)}
                  onSaveDog={handleSaveAnimal}
                  onDeleteDog={handleDeleteAnimal}
                  editingAnimal={editingAnimal}
                  editingDog={editingAnimal}
                  onClearEditing={() => setEditingAnimal(null)}
                />
              )}

              {activeTab === 'cows' && (
                <CowsPage
                  cows={cows}
                  onBackToDashboard={() => {
                    setEditingAnimal(null);
                    setActiveTab('dashboard');
                  }}
                  onViewDetail={(animal) => setSelectedAnimal(animal)}
                  onSaveCow={handleSaveAnimal}
                  onDeleteCow={handleDeleteAnimal}
                  editingAnimal={editingAnimal}
                  editingCow={editingAnimal}
                  onClearEditing={() => setEditingAnimal(null)}
                />
              )}
            </>
          )}
        </ErrorBoundary>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-border bg-[#1a1714] py-4 px-6 text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🐾</span>
            <span className="font-semibold text-foreground">Jeev Jantu Vihar (जीव जंतु विहार)</span>
            <span>&bull; Bhopal, Madhya Pradesh</span>
          </div>
          <div className="text-[11px] text-muted">
            Animal Welfare & Sanctuary Management System
          </div>
        </div>
      </footer>

      {/* Profile Detail Modal */}
      {selectedAnimal && (
        <ErrorBoundary scope="section" onReset={() => setSelectedAnimal(null)}>
          <AnimalModal
            animal={selectedAnimal}
            onClose={() => setSelectedAnimal(null)}
            onEdit={(animal) => {
              setSelectedAnimal(null);
              setEditingAnimal(animal);
              if (animal.animal_type === 'dog') {
                setActiveTab('dogs');
              } else {
                setActiveTab('cows');
              }
            }}
            onDelete={handleDeleteAnimal}
          />
        </ErrorBoundary>
      )}

      {/* Field Worker Mobile App Simulator Modal */}
      <ErrorBoundary scope="section" onReset={() => setIsMobileSimOpen(false)}>
        <MobileSimulatorModal
          isOpen={isMobileSimOpen}
          onClose={() => setIsMobileSimOpen(false)}
          animals={animals}
          onAddAnimal={async (newAnimal) => {
            await createAnimal(newAnimal, currentUser);
            await refreshData();
          }}
        />
      </ErrorBoundary>

      {/* Account Security & Password Settings Modal */}
      <ErrorBoundary scope="section" onReset={() => setIsSettingsOpen(false)}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </ErrorBoundary>

      {/* Cloud Sync Status Feedback Toast */}
      {syncNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all flex items-start gap-3 ${
            syncNotice.type === 'error'
              ? 'bg-[#2a1417]/95 border-red-500/50 text-red-200'
              : syncNotice.type === 'warning'
              ? 'bg-[#261f12]/95 border-amber-500/50 text-amber-200'
              : 'bg-[#12241d]/95 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="text-xl shrink-0 mt-0.5 select-none">
            {syncNotice.type === 'error' ? '⚠️' : syncNotice.type === 'warning' ? '⚡' : '✅'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {syncNotice.type === 'error'
                  ? 'Cloud Sync Failed'
                  : syncNotice.type === 'warning'
                  ? 'Offline Mode Active'
                  : 'Cloud Synced'}
              </span>
              <button
                type="button"
                onClick={() => setSyncNotice(null)}
                className="text-muted hover:text-foreground text-sm font-semibold px-1 rounded transition-colors"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-95">
              {syncNotice.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
