import React from 'react';
import { useTranslation } from '../lib/i18n';
import StatsCards from '../components/StatsCards';
import AnimalCard from '../components/AnimalCard';
import { Plus, Download, ArrowRight } from 'lucide-react';
import { exportAnimalsCSV } from '../lib/api';

export default function DashboardPage({
  stats,
  onNavigate,
  onViewDetail,
  onAddNew
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[#c27a66] uppercase tracking-wider bg-[#c27a66]/15 px-2.5 py-0.5 rounded-full border border-[#c27a66]/30">
              Jeev Jantu Vihar &bull; Bhopal
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mt-1.5">
            {t('dashboard.title')}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportAnimalsCSV(stats.allAnimals || [])}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#262220] hover:bg-[#332e2b] text-foreground border border-border flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#6b94b8]" />
            <span>{t('dashboard.exportCensus')} (CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <StatsCards stats={stats} onNavigate={onNavigate} />

      {/* Two Column Layout: Dogs on Left, Cows on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Recent Dogs */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🐕</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('dashboard.recentDogs')}
                </h3>
                <p className="text-[11px] text-muted">{t('dashboard.streetRescuesUnderCare')}</p>
              </div>
            </div>

            <button
              onClick={() => onAddNew('dog')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6b94b8] hover:bg-[#5a82a6] text-white flex items-center gap-1 transition shadow"
            >
              <Plus className="w-3 h-3" />
              <span>{t('dashboard.addNewDog')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentDogs && stats.recentDogs.length > 0 ? (
              stats.recentDogs.map((dog) => (
                <AnimalCard key={dog.id} animal={dog} onViewDetail={onViewDetail} />
              ))
            ) : (
              <div className="py-8 px-4 text-center space-y-2 bg-[#1a1714] rounded-xl border border-dashed border-border">
                <span className="text-2xl block">🐕</span>
                <p className="text-xs font-semibold text-foreground">{t('dashboard.noDogsYet')}</p>
                <p className="text-[11px] text-muted max-w-xs mx-auto">
                  {t('dashboard.databaseCleanDogs')}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('dogs')}
            className="w-full py-2.5 rounded-xl border border-border bg-[#1a1714] hover:bg-[#262220] text-xs font-semibold text-[#6b94b8] flex items-center justify-center gap-1.5 transition"
          >
            <span>{t('dashboard.viewAllDogs', { count: stats.totalDogs })}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* RIGHT COLUMN: Recent Cows */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🐄</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('dashboard.recentCows')}
                </h3>
                <p className="text-[11px] text-muted">{t('dashboard.cattleClinicUnderCare')}</p>
              </div>
            </div>

            <button
              onClick={() => onAddNew('cow')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6b94b8] hover:bg-[#5a82a6] text-white flex items-center gap-1 transition shadow"
            >
              <Plus className="w-3 h-3" />
              <span>{t('dashboard.addNewCow')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {stats.recentCows && stats.recentCows.length > 0 ? (
              stats.recentCows.map((cow) => (
                <AnimalCard key={cow.id} animal={cow} onViewDetail={onViewDetail} />
              ))
            ) : (
              <div className="py-8 px-4 text-center space-y-2 bg-[#1a1714] rounded-xl border border-dashed border-border">
                <span className="text-2xl block">🐄</span>
                <p className="text-xs font-semibold text-foreground">{t('dashboard.noCowsYet')}</p>
                <p className="text-[11px] text-muted max-w-xs mx-auto">
                  {t('dashboard.databaseCleanCows')}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('cows')}
            className="w-full py-2.5 rounded-xl border border-border bg-[#1a1714] hover:bg-[#262220] text-xs font-semibold text-[#6b94b8] flex items-center justify-center gap-1.5 transition"
          >
            <span>{t('dashboard.viewAllCows', { count: stats.totalCows })}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

    </div>
  );
}
