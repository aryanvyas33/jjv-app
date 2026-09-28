import React, { useState, useRef } from 'react';
import { useTranslation } from '../lib/i18n';
import { uploadAnimalPhoto } from '../lib/storage';
import { Camera, Sparkles, Check, X, Upload } from 'lucide-react';

export default function AnimalForm({ animalType, initialData, onSave, onCancel }) {
  const { t } = useTranslation();
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    animal_type: animalType,
    estimated_age: initialData?.estimated_age || '',
    breed: initialData?.breed || (animalType === 'dog' ? 'Indian Pariah' : 'Desi Indigenous'),
    gender: initialData?.gender || 'Male',
    weight_at_rescue: initialData?.weight_at_rescue || '',
    date_of_rescue: initialData?.date_of_rescue || new Date().toISOString().split('T')[0],
    location_of_rescue: initialData?.location_of_rescue || '',
    condition_at_rescue: initialData?.condition_at_rescue || 'Moderate',
    condition_description: initialData?.condition_description || '',
    rescued_by: initialData?.rescued_by || '',
    treatment_ongoing: initialData ? initialData.treatment_ongoing : true,
    treatment_details: initialData?.treatment_details || '',
    recovery_time: initialData?.recovery_time || '',
    veterinary_doctor: initialData?.veterinary_doctor || 'Dr. R. K. Sharma',
    status: initialData?.status || 'Under Treatment',
    before_image_url: initialData?.before_image_url || '',
    after_image_url: initialData?.after_image_url || ''
  });

  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const beforeFileRef = useRef(null);
  const afterFileRef = useRef(null);

  const dogBreeds = ['Indian Pariah', 'Labrador Mix', 'German Shepherd Mix', 'Rottweiler Mix', 'Spitz Mix', 'Puppy / Mixed', 'Unknown'];
  const cowBreeds = ['Desi Indigenous', 'Sahiwal Cross', 'Gir Cross', 'Jersey Cross', 'Holstein Friesian (HF) Cross', 'Desi Nandi', 'Desi Calf/Heifer', 'Unknown'];

  const breeds = animalType === 'dog' ? dogBreeds : cowBreeds;

  const handlePhotoUpload = async (e, photoType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (photoType === 'before') setUploadingBefore(true);
      if (photoType === 'after') setUploadingAfter(true);

      const url = await uploadAnimalPhoto(file, animalType);
      if (photoType === 'before') {
        setFormData((prev) => ({ ...prev, before_image_url: url }));
      } else {
        setFormData((prev) => ({ ...prev, after_image_url: url }));
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert(t('animalForm.errorUploadFailed'));
    } finally {
      if (photoType === 'before') setUploadingBefore(false);
      if (photoType === 'after') setUploadingAfter(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(t('animalForm.errorNameRequired'));
      return;
    }
    if (!formData.location_of_rescue.trim()) {
      alert(t('animalForm.errorLocationRequired'));
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        weight_at_rescue: formData.weight_at_rescue ? parseFloat(formData.weight_at_rescue) : null
      });
    } catch (err) {
      console.error('Error saving animal:', err);
      alert(err.message || t('animalForm.errorSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 bg-[#1a1714] p-6 rounded-2xl border border-border">
      
      {/* Form Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>{animalType === 'dog' ? '🐕' : '🐄'}</span>
            <span>
              {isEditing
                ? t('animalForm.editProfile', { name: formData.name })
                : t('animalForm.addNewProfile', { type: animalType === 'dog' ? t('common.dog') : t('common.cow') })}
            </span>
          </h3>
          <p className="text-xs text-muted">
            {animalType === 'dog' ? t('animalForm.dogSubtitle') : t('animalForm.cowSubtitle')}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-muted hover:text-foreground rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 1. Basic Information */}
      <div>
        <h4 className="text-xs font-bold text-[#6b94b8] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span>ℹ️</span> {t('animalForm.basicInfo')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#262220]/30 p-4 rounded-xl border border-border">
          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('animalForm.nameLabel', { type: animalType === 'dog' ? t('common.dog') : t('common.cow') })}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={animalType === 'dog' ? t('animalForm.dogNamePlaceholder') : t('animalForm.cowNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.age')}
            </label>
            <input
              type="text"
              value={formData.estimated_age}
              onChange={(e) => setFormData({ ...formData, estimated_age: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.agePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.breed')}
            </label>
            <select
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
            >
              {breeds.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.gender')}
            </label>
            <div className="flex items-center space-x-4 mt-2">
              <label className="inline-flex items-center text-xs text-muted cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formData.gender === 'Male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="text-[#6b94b8] focus:ring-[#6b94b8]"
                />
                <span className="ml-1.5 text-foreground">{animalType === 'cow' ? t('animalForm.bullGender') : t('common.male')}</span>
              </label>

              <label className="inline-flex items-center text-xs text-muted cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formData.gender === 'Female'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="text-[#6b94b8] focus:ring-[#6b94b8]"
                />
                <span className="ml-1.5 text-foreground">{t('common.female')}</span>
              </label>

              {animalType === 'cow' && (
                <label className="inline-flex items-center text-xs text-muted cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Calf"
                    checked={formData.gender === 'Calf'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-[#6b94b8] focus:ring-[#6b94b8]"
                  />
                  <span className="ml-1.5 text-foreground">{t('common.calf')}</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.weight')} (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight_at_rescue}
              onChange={(e) => setFormData({ ...formData, weight_at_rescue: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={animalType === 'dog' ? t('animalForm.dogWeightPlaceholder') : t('animalForm.cowWeightPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('animalForm.currentStatus')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
            >
              <option value="Under Treatment">{t('common.underTreatment')}</option>
              <option value="Critical">{t('common.critical')}</option>
              <option value="Stable">{t('common.stable')}</option>
              <option value="Recovered">{t('common.recovered')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Rescue Details */}
      <div>
        <h4 className="text-xs font-bold text-[#c27a66] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span>📍</span> {t('animalForm.rescueDetails')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#262220]/30 p-4 rounded-xl border border-border">
          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.dateOfRescue')} *
            </label>
            <input
              type="date"
              required
              value={formData.date_of_rescue}
              onChange={(e) => setFormData({ ...formData, date_of_rescue: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('animalForm.locationLabel')}
            </label>
            <input
              type="text"
              required
              value={formData.location_of_rescue}
              onChange={(e) => setFormData({ ...formData, location_of_rescue: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.locationPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.condition')}
            </label>
            <select
              value={formData.condition_at_rescue}
              onChange={(e) => setFormData({ ...formData, condition_at_rescue: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
            >
              <option value="Critical">{t('animalForm.conditionCritical')}</option>
              <option value="Severe">{t('animalForm.conditionSevere')}</option>
              <option value="Moderate">{t('animalForm.conditionModerate')}</option>
              <option value="Mild">{t('animalForm.conditionMild')}</option>
              <option value="Healthy">{t('animalForm.conditionHealthy')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.rescuedBy')}
            </label>
            <input
              type="text"
              value={formData.rescued_by}
              onChange={(e) => setFormData({ ...formData, rescued_by: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.rescuedByPlaceholder')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.description')}
            </label>
            <textarea
              rows={2}
              value={formData.condition_description}
              onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.conditionDescPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* 3. Treatment Information */}
      <div>
        <h4 className="text-xs font-bold text-[#c9a355] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span>⚕️</span> {t('animalForm.treatmentSection')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#262220]/30 p-4 rounded-xl border border-border">
          <div className="md:col-span-2 flex items-center space-x-3">
            <label className="text-xs font-medium text-[#b5aea8]">{t('common.treatmentOngoing')}</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.treatment_ongoing}
                onChange={(e) => setFormData({ ...formData, treatment_ongoing: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#332e2b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6b94b8]"></div>
              <span className="ml-2 text-xs font-semibold text-foreground">
                {formData.treatment_ongoing ? t('animalForm.treatmentOngoingYes') : t('animalForm.treatmentOngoingNo')}
              </span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.treatment')}
            </label>
            <textarea
              rows={2}
              value={formData.treatment_details}
              onChange={(e) => setFormData({ ...formData, treatment_details: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.treatmentPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.recoveryTime')}
            </label>
            <input
              type="text"
              value={formData.recovery_time}
              onChange={(e) => setFormData({ ...formData, recovery_time: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.recoveryTimePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b5aea8] mb-1">
              {t('common.vet')}
            </label>
            <input
              type="text"
              value={formData.veterinary_doctor}
              onChange={(e) => setFormData({ ...formData, veterinary_doctor: e.target.value })}
              className="w-full bg-[#141110] border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
              placeholder={t('animalForm.vetPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* 4. Photo Uploads (Before & After) */}
      <div>
        <h4 className="text-xs font-bold text-[#b55e5e] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <span>📷</span> {t('common.photos')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Before Photo Box */}
          <div className="bg-[#262220]/30 border-2 border-dashed border-border hover:border-[#6b94b8] rounded-xl p-4 flex flex-col items-center justify-center text-center transition relative min-h-[160px]">
            <input
              type="file"
              accept="image/*"
              ref={beforeFileRef}
              onChange={(e) => handlePhotoUpload(e, 'before')}
              className="hidden"
            />
            {formData.before_image_url ? (
              <div className="relative w-full">
                <img
                  src={formData.before_image_url}
                  alt="Before"
                  className="w-full h-32 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={() => beforeFileRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-[#6b94b8] hover:underline block mx-auto"
                >
                  {t('animalForm.changeBeforePhoto')}
                </button>
              </div>
            ) : (
              <div
                onClick={() => beforeFileRef.current?.click()}
                className="cursor-pointer flex flex-col items-center py-4"
              >
                <Camera className="w-8 h-8 text-[#6b94b8] mb-2" />
                <span className="text-xs font-semibold text-foreground">{t('common.beforePhoto')}</span>
                <span className="text-[11px] text-muted mt-1">
                  {uploadingBefore ? t('animalForm.uploading') : t('animalForm.capturePlaceholder')}
                </span>
              </div>
            )}
          </div>

          {/* After Photo Box */}
          <div className="bg-[#262220]/30 border-2 border-dashed border-border hover:border-[#c27a66] rounded-xl p-4 flex flex-col items-center justify-center text-center transition relative min-h-[160px]">
            <input
              type="file"
              accept="image/*"
              ref={afterFileRef}
              onChange={(e) => handlePhotoUpload(e, 'after')}
              className="hidden"
            />
            {formData.after_image_url ? (
              <div className="relative w-full">
                <img
                  src={formData.after_image_url}
                  alt="After"
                  className="w-full h-32 object-cover rounded-lg border border-[#c27a66]/40"
                />
                <button
                  type="button"
                  onClick={() => afterFileRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-[#c27a66] hover:underline block mx-auto"
                >
                  {t('animalForm.changeAfterPhoto')}
                </button>
              </div>
            ) : (
              <div
                onClick={() => afterFileRef.current?.click()}
                className="cursor-pointer flex flex-col items-center py-4"
              >
                <Sparkles className="w-8 h-8 text-[#c27a66] mb-2" />
                <span className="text-xs font-semibold text-foreground">{t('common.afterPhoto')}</span>
                <span className="text-[11px] text-muted mt-1">
                  {uploadingAfter ? t('animalForm.uploading') : t('animalForm.capturePlaceholder')}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-xs font-semibold border border-border text-muted hover:text-foreground hover:bg-[#262220] transition"
          >
            {t('common.cancel')}
          </button>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#8f5c48] hover:bg-[#a86b56] text-white transition flex items-center gap-1.5 shadow"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? t('animalForm.saving') : `${t('common.save')} ✓`}</span>
        </button>
      </div>

    </form>
  );
}
