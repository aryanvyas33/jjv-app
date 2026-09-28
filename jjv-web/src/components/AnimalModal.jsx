import React from 'react';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { X, Calendar, MapPin, User, Stethoscope, Clock, Weight, Sparkles, Trash2, Edit3 } from 'lucide-react';

export default function AnimalModal({ animal, onClose, onEdit, onDelete }) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  if (!animal) return null;

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1e1b19] border border-[#332e2b] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#332e2b] flex items-center justify-between bg-[#1a1714]">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{animal.animal_type === 'dog' ? '🐕' : '🐄'}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-foreground">{animal.name}</h3>
                <span className="text-xs font-mono text-[#c9a355] bg-[#262220] px-2 py-0.5 rounded border border-border">
                  {animal.animal_id}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(animal.status)}`}>
                  {animal.status}
                </span>
              </div>
              <p className="text-xs text-muted">
                {animal.breed || t('animalModal.indigenous')} &bull; {animal.gender || t('animalModal.unknown')} &bull; {animal.estimated_age || t('animalModal.unknownAge')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-[#262220] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Photos Comparison Section */}
          <div>
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c27a66]" />
              {t('common.photos')} {t('animalModal.beforeAndAfter')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Before Photo */}
              <div className="bg-[#120f0d] border border-[#332e2b] rounded-xl p-3 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#c9a355] mb-2 self-start flex items-center gap-1">
                  📸 {t('common.beforePhoto')}
                </span>
                {animal.before_image_url ? (
                  <img
                    src={animal.before_image_url}
                    alt="Rescue Condition"
                    className="w-full h-48 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg bg-[#1a1714] border border-dashed border-[#332e2b] flex flex-col items-center justify-center text-muted text-xs">
                    <span className="text-2xl mb-1">📷</span>
                    <span>{t('animalModal.noBeforePhoto')}</span>
                  </div>
                )}
              </div>

              {/* After Photo */}
              <div className="bg-[#120f0d] border border-[#332e2b] rounded-xl p-3 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#c27a66] mb-2 self-start flex items-center gap-1">
                  ✨ {t('common.afterPhoto')}
                </span>
                {animal.after_image_url ? (
                  <img
                    src={animal.after_image_url}
                    alt="Recovery Condition"
                    className="w-full h-48 rounded-lg object-cover border border-[#c27a66]/40"
                  />
                ) : (
                  <div className="w-full h-48 rounded-lg bg-[#1a1714] border border-dashed border-[#332e2b] flex flex-col items-center justify-center text-muted text-xs">
                    <span className="text-2xl mb-1">🏥</span>
                    <span>{t('animalModal.pendingAfterPhoto')}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#1a1714] p-3 rounded-xl border border-border">
              <span className="text-muted block text-[11px]">{t('common.weight')}</span>
              <span className="font-bold text-foreground text-sm mt-0.5 block">
                {animal.weight_at_rescue ? `${animal.weight_at_rescue} kg` : 'N/A'}
              </span>
            </div>
            <div className="bg-[#1a1714] p-3 rounded-xl border border-border">
              <span className="text-muted block text-[11px]">{t('common.dateOfRescue')}</span>
              <span className="font-bold text-foreground text-sm mt-0.5 block">
                {animal.date_of_rescue}
              </span>
            </div>
            <div className="bg-[#1a1714] p-3 rounded-xl border border-border">
              <span className="text-muted block text-[11px]">{t('common.condition')}</span>
              <span className="font-bold text-[#c9a355] text-sm mt-0.5 block">
                {animal.condition_at_rescue}
              </span>
            </div>
            <div className="bg-[#1a1714] p-3 rounded-xl border border-border">
              <span className="text-muted block text-[11px]">{t('common.recoveryTime')}</span>
              <span className="font-bold text-[#c27a66] text-sm mt-0.5 block">
                {animal.recovery_time || t('table.ongoing')}
              </span>
            </div>
          </div>

          {/* Rescue Information & Condition */}
          <div className="bg-[#1a1714] p-4 rounded-xl border border-border space-y-2 text-xs">
            <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-[#c27a66]" />
              {t('common.location')}: <span className="font-normal text-muted">{animal.location_of_rescue}</span>
            </h4>
            <p className="text-muted leading-relaxed">
              <span className="font-semibold text-[#b5aea8]">{t('common.description')}: </span>
              {animal.condition_description || t('animalModal.noConditionNotes')}
            </p>
            {animal.rescued_by && (
              <p className="text-[11px] text-muted pt-1 flex items-center gap-1">
                <User className="w-3 h-3 text-[#6b94b8]" />
                <span>{t('common.rescuedBy')}: </span>
                <span className="text-foreground font-medium">{animal.rescued_by}</span>
              </p>
            )}
          </div>

          {/* Treatment & Medical Protocol */}
          <div className="bg-[#1a1714] p-4 rounded-xl border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                <Stethoscope className="w-4 h-4 text-[#6b94b8]" />
                {t('common.treatment')}
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                animal.treatment_ongoing ? 'bg-[#c9a355]/20 text-[#c9a355]' : 'bg-[#c27a66]/20 text-[#c27a66]'
              }`}>
                {animal.treatment_ongoing ? t('animalModal.ongoingTreatment') : t('animalModal.treatmentCompleted')}
              </span>
            </div>
            <p className="text-muted leading-relaxed whitespace-pre-line">
              {animal.treatment_details || t('animalModal.standardProtocol')}
            </p>
            {animal.veterinary_doctor && (
              <p className="text-[11px] text-muted pt-1">
                <span className="font-semibold text-[#b5aea8]">{t('common.vet')}: </span>
                <span className="text-foreground">{animal.veterinary_doctor}</span>
              </p>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#332e2b] bg-[#1a1714] flex items-center justify-between">
          <div>
            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm(t('common.confirmDelete'))) {
                    onDelete(animal.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#b55e5e] hover:bg-[#b55e5e]/15 border border-[#b55e5e]/30 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('common.delete')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onEdit(animal);
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#6b94b8] text-white hover:bg-[#5a82a6] flex items-center gap-1.5 transition shadow"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('common.edit')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted hover:text-foreground hover:bg-[#262220] transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
