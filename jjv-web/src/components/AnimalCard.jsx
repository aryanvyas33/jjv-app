import React from 'react';
import { useTranslation } from '../lib/i18n';
import { MapPin, Calendar, Activity, ArrowRight } from 'lucide-react';

export default function AnimalCard({ animal, onViewDetail }) {
  const { t } = useTranslation();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Critical':
        return 'bg-[rgba(181,94,94,0.15)] text-[#b55e5e] border-[rgba(181,94,94,0.3)]';
      case 'Under Treatment':
        return 'bg-[rgba(201,163,85,0.15)] text-[#c9a355] border-[rgba(201,163,85,0.3)]';
      case 'Recovered':
        return 'bg-[rgba(194,122,102,0.15)] text-[#c27a66] border-[rgba(194,122,102,0.3)]';
      case 'Stable':
      default:
        return 'bg-[rgba(107,148,184,0.15)] text-[#6b94b8] border-[rgba(107,148,184,0.3)]';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Under Treatment':
        return t('common.underTreatment');
      case 'Critical':
        return t('common.critical');
      case 'Recovered':
        return t('common.recovered');
      case 'Stable':
        return t('common.stable');
      default:
        return status;
    }
  };

  return (
    <div className="bg-[#1a1714] border border-border rounded-xl p-4 hover:border-[#6b94b8]/50 transition space-y-3">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold text-foreground">{animal.name}</h4>
            <span className="text-[10px] font-mono text-muted bg-[#262220] px-1.5 py-0.5 rounded">
              {animal.animal_id}
            </span>
          </div>
          <div className="flex items-center text-[11px] text-muted space-x-3 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#c9a355]" />
              {animal.date_of_rescue}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#c27a66]" />
              {animal.location_of_rescue}
            </span>
          </div>
        </div>

        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(animal.status)}`}>
          {getStatusText(animal.status)}
        </span>
      </div>

      {/* Treatment excerpt */}
      <div className="text-xs text-muted bg-[#262220]/50 p-2 rounded-lg border border-border/50">
        <p className="line-clamp-2">
          <span className="font-semibold text-[#b5aea8]">{t('common.treatment')}: </span>
          {animal.treatment_details || animal.condition_description}
        </p>
      </div>

      {/* Footer: Photos preview + View button */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <div className="flex items-center space-x-2">
          {animal.before_image_url ? (
            <img
              src={animal.before_image_url}
              alt="Before"
              className="w-7 h-7 rounded-md object-cover border border-border"
              title="Before Photo"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-[#262220] border border-border flex items-center justify-center text-[10px] text-muted">
              📷
            </div>
          )}

          {animal.after_image_url ? (
            <img
              src={animal.after_image_url}
              alt="After"
              className="w-7 h-7 rounded-md object-cover border border-[#c27a66]/40"
              title="After Photo"
            />
          ) : (
            <div className="w-7 h-7 rounded-md bg-[#262220] border border-border flex items-center justify-center text-[10px] text-muted">
              ✨
            </div>
          )}

          {animal.recovery_time && (
            <span className="text-[10px] text-[#c27a66] font-medium pl-1">
              ⏱️ {animal.recovery_time}
            </span>
          )}
        </div>

        <button
          onClick={() => onViewDetail(animal)}
          className="text-xs font-semibold text-[#6b94b8] hover:text-[#8badc8] flex items-center gap-1 transition"
        >
          <span>{t('common.view')}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
