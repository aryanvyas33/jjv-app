import React from 'react';
import { useTranslation } from '../lib/i18n';
import { Activity, MapPin, Clock, Award } from 'lucide-react';

export default function StatisticsTab({ animals = [], animalType }) {
  const { t, lang } = useTranslation();

  const total = animals.length;
  const recovered = animals.filter((a) => a.status === 'Recovered').length;
  const underTreatment = animals.filter((a) => a.status === 'Under Treatment' || a.treatment_ongoing).length;
  const critical = animals.filter((a) => a.status === 'Critical').length;
  const recoveryRate = total > 0 ? Math.round((recovered / total) * 100) : 0;

  // 1. Calculate Dynamic Average Recovery Time from fed animal records
  const calculateAvgRecovery = () => {
    const durations = [];

    animals.forEach((a) => {
      // Check explicit recovery_time string (e.g. '14 days', '3 weeks', '1 month', '21')
      if (a.recovery_time && typeof a.recovery_time === 'string') {
        const text = a.recovery_time.toLowerCase().trim();
        if (text !== 'ongoing' && text !== 'n/a' && text !== 'none' && text !== '') {
          const match = text.match(/(\d+(\.\d+)?)/);
          if (match) {
            const val = parseFloat(match[1]);
            if (text.includes('month')) {
              durations.push(val * 30);
            } else if (text.includes('week')) {
              durations.push(val * 7);
            } else {
              durations.push(val);
            }
            return;
          }
        }
      }

      // If status is Recovered and dates exist, compute days between rescue and completion
      if (a.status === 'Recovered' && a.date_of_rescue) {
        const rescueDate = new Date(a.date_of_rescue);
        const endDate = a.updated_at ? new Date(a.updated_at) : null;
        if (endDate && !isNaN(rescueDate.getTime()) && !isNaN(endDate.getTime())) {
          const diffDays = Math.max(1, Math.round((endDate - rescueDate) / (1000 * 60 * 60 * 24)));
          if (diffDays <= 365) {
            durations.push(diffDays);
          }
        }
      }
    });

    if (durations.length === 0) {
      return { avgDays: 0, count: 0 };
    }
    const sum = durations.reduce((acc, d) => acc + d, 0);
    return {
      avgDays: Math.round(sum / durations.length),
      count: durations.length
    };
  };

  const { avgDays, count: recoveryCasesCount } = calculateAvgRecovery();

  // 2. Calculate Dynamic Monthly Intake Breakdown from actual rescue dates
  const getMonthlyBreakdown = () => {
    const now = new Date();
    const months = [];

    // Rolling window of last 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const localizedMonth = d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { month: 'short' });
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: localizedMonth,
        year: d.getFullYear(),
        count: 0
      });
    }

    // Tally actual fed animal records
    animals.forEach((a) => {
      const dateStr = a.date_of_rescue || a.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const target = months.find((m) => m.key === key);
          if (target) {
            target.count += 1;
          }
        }
      }
    });

    return months;
  };

  const monthlyBars = getMonthlyBreakdown();
  const maxMonthlyCount = Math.max(...monthlyBars.map((b) => b.count), 1);
  const peakMonth = [...monthlyBars].sort((a, b) => b.count - a.count)[0];

  // 3. Calculate Location Hotspots from fed records
  const locationCounts = {};
  animals.forEach((a) => {
    if (a.location_of_rescue && a.location_of_rescue.trim()) {
      const loc = a.location_of_rescue.split(',')[0].trim();
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    }
  });

  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Rescued */}
        <div className="bg-[#1a1714] border border-border p-4 rounded-xl shadow-sm">
          <span className="text-xs text-muted block mb-1">
            {t('statistics.totalRescued', {
              type: animalType === 'dog' ? t('common.dogs') : t('common.cows')
            })}
          </span>
          <span className="text-3xl font-extrabold text-foreground">{total}</span>
          <p className="text-[11px] text-muted mt-2">{t('statistics.admissionRegistry')}</p>
        </div>

        {/* Recovery Rate */}
        <div className="bg-[#1a1714] border border-border p-4 rounded-xl shadow-sm">
          <span className="text-xs text-muted block mb-1">{t('dashboard.recoveryRate')}</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#c27a66]">{recoveryRate}%</span>
            <span className="text-xs text-muted">
              {t('statistics.healedCount', { recovered })}
            </span>
          </div>
          <div className="w-full bg-[#262220] rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-[#c27a66] h-full rounded-full transition-all duration-500"
              style={{ width: `${recoveryRate}%` }}
            ></div>
          </div>
        </div>

        {/* Dynamic Average Recovery Time */}
        <div className="bg-[#1a1714] border border-border p-4 rounded-xl shadow-sm">
          <span className="text-xs text-muted block mb-1">{t('dashboard.avgRecovery')}</span>
          <span className="text-3xl font-extrabold text-[#6b94b8]">
            {t('statistics.daysCount', { days: avgDays > 0 ? avgDays : 0 })}
          </span>
          <p className="text-[11px] text-muted mt-2">
            {recoveryCasesCount > 0
              ? t('statistics.basedOnCases', {
                  count: recoveryCasesCount,
                  plural: recoveryCasesCount > 1 ? 's' : ''
                })
              : t('statistics.awaitingCases')}
          </p>
        </div>

        {/* In Active Medical Care */}
        <div className="bg-[#1a1714] border border-border p-4 rounded-xl shadow-sm">
          <span className="text-xs text-muted block mb-1">{t('statistics.inActiveMedicalCare')}</span>
          <span className="text-3xl font-extrabold text-[#c9a355]">{underTreatment}</span>
          <p className="text-[11px] text-[#b55e5e] mt-2">
            {t('statistics.criticalWardNotice', { critical })}
          </p>
        </div>

      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hotspots in Bhopal */}
        <div className="bg-[#1a1714] border border-border p-5 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-[#c27a66] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {t('dashboard.topLocations')}
          </h4>
          <div className="space-y-3">
            {topLocations.length > 0 ? (
              topLocations.map(([loc, count], idx) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={loc} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {idx + 1}. {loc}
                      </span>
                      <span className="text-muted font-mono">
                        {t('statistics.rescuesCount', { count, pct })}
                      </span>
                    </div>
                    <div className="w-full bg-[#262220] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#6b94b8] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted space-y-1">
                <span className="text-lg block">📍</span>
                <p className="font-semibold text-foreground/80">{t('statistics.noLocations')}</p>
                <p className="text-[11px]">{t('statistics.noLocationsHint')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Monthly Intake Breakdown */}
        <div className="bg-[#1a1714] border border-border p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#6b94b8] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              {t('statistics.monthlyIntakeTrend')}
            </h4>
            <span className="text-[11px] text-muted font-mono">
              {t('statistics.totalLogged', { total })}
            </span>
          </div>
          
          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-border">
            {monthlyBars.map((bar) => {
              const heightPct = bar.count > 0
                ? Math.max(Math.round((bar.count / maxMonthlyCount) * 100), 10)
                : 4;
              return (
                <div key={bar.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className={`text-[10px] font-mono ${bar.count > 0 ? 'text-[#6b94b8] font-bold' : 'text-muted/60'}`}>
                    {bar.count}
                  </span>
                  <div
                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${
                      bar.count > 0
                        ? 'bg-gradient-to-t from-[#4a7194] to-[#c27a66]'
                        : 'bg-[#262220]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <span className="text-[11px] font-medium text-foreground">{bar.month}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted text-center">
            {total > 0 && peakMonth && peakMonth.count > 0
              ? t('statistics.peakIntakeNotice', {
                  month: peakMonth.month,
                  year: peakMonth.year,
                  count: peakMonth.count
                })
              : t('statistics.noIntakeNotice')}
          </p>
        </div>

      </div>

    </div>
  );
}
