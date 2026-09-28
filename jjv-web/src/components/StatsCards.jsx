import React from 'react';
import { useTranslation } from '../lib/i18n';

export default function StatsCards({ stats, onNavigate }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Dogs */}
      <div 
        onClick={() => onNavigate && onNavigate('dogs')} 
        className="bg-card p-4 rounded-xl border border-border cursor-pointer hover:border-[#6b94b8]/50 transition shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{t('dashboard.totalDogs')}</span>
          <span className="text-lg">🐕</span>
        </div>
        <div className="text-3xl font-black mt-1 text-[#c27a66]">
          {stats.totalDogs}
        </div>
        <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
          <span>🐕</span> {t('dashboard.dogsSubtitle')}
        </p>
      </div>

      {/* 2. Total Cows */}
      <div 
        onClick={() => onNavigate && onNavigate('cows')}
        className="bg-card p-4 rounded-xl border border-border cursor-pointer hover:border-[#6b94b8]/50 transition shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{t('dashboard.totalCows')}</span>
          <span className="text-lg">🐄</span>
        </div>
        <div className="text-3xl font-black mt-1 text-[#6b94b8]">
          {stats.totalCows}
        </div>
        <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
          <span>🐄</span> {t('dashboard.cowsSubtitle')}
        </p>
      </div>

      {/* 3. Under Treatment */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{t('dashboard.underTreatment')}</span>
          <span className="text-lg">🏥</span>
        </div>
        <div className="text-3xl font-black mt-1 text-[#c9a355]">
          {stats.underTreatmentTotal}
        </div>
        <p className="text-xs text-muted mt-1.5">
          {t('dashboard.casesRatio', { dogs: stats.underTreatmentDogs, cows: stats.underTreatmentCows })}
        </p>
      </div>

      {/* 4. Fully Recovered */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{t('dashboard.recovered')}</span>
          <span className="text-lg">✅</span>
        </div>
        <div className="text-3xl font-black mt-1 text-[#c27a66]">
          {stats.recoveredTotal}
        </div>
        <p className="text-xs text-muted mt-1.5">
          {t('dashboard.quarterRatio', { dogs: stats.recoveredDogs, cows: stats.recoveredCows })}
        </p>
      </div>
    </div>
  );
}
