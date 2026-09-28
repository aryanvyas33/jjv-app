import React, { useState, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import AnimalTable from '../components/AnimalTable';
import AnimalForm from '../components/AnimalForm';
import StatisticsTab from '../components/StatisticsTab';
import { Plus, ListFilter, BarChart3, ArrowLeft } from 'lucide-react';

export default function CowsPage({
  cows,
  onBackToDashboard,
  onViewDetail,
  onSaveCow,
  onDeleteCow,
  initialTab = 'list',
  editingAnimal = null,
  editingCow: propEditingCow = null,
  initialEditingCow = null,
  onClearEditing
}) {
  const targetCow = editingAnimal || propEditingCow || initialEditingCow;
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(targetCow ? 'add' : initialTab);
  const [editingCow, setEditingCow] = useState(targetCow);

  useEffect(() => {
    if (targetCow) {
      setEditingCow(targetCow);
      setActiveTab('add');
    }
  }, [targetCow]);

  const handleEdit = (cow) => {
    setEditingCow(cow);
    setActiveTab('add');
  };

  const handleSave = async (formData) => {
    await onSaveCow(formData, editingCow?.id);
    setEditingCow(null);
    setActiveTab('list');
    onClearEditing?.();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <span className="text-xs font-bold text-[#6b94b8] uppercase tracking-wider bg-[#6b94b8]/15 px-2.5 py-0.5 rounded-full border border-[#6b94b8]/30">
            {t('cowsPage.badge')}
          </span>
          <h2 className="text-2xl font-bold text-foreground mt-1.5">
            {t('nav.cows')} &mdash; Jeev Jantu Vihar, Bhopal
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t('cowsPage.subtitle')}
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="text-xs font-semibold text-[#6b94b8] hover:text-[#8badc8] flex items-center gap-1.5 transition self-start md:self-center"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('nav.backToDashboard')}</span>
        </button>
      </div>

      {/* 3 Tab Navigation */}
      <div className="flex space-x-2 border-b border-border">
        <button
          onClick={() => {
            setEditingCow(null);
            setActiveTab('list');
            onClearEditing?.();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'list'
              ? 'border-[#6b94b8] text-[#6b94b8] bg-[#262220]/40'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>📋 {t('cowsPage.allCowsTab', { count: cows.length })}</span>
        </button>

        <button
          onClick={() => {
            setEditingCow(null);
            setActiveTab('add');
            onClearEditing?.();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'add'
              ? 'border-[#6b94b8] text-[#6b94b8] bg-[#262220]/40'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{editingCow ? `✏️ ${t('cowsPage.editCow', { name: editingCow.name })}` : `➕ ${t('dashboard.addNewCow')}`}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('stats');
            onClearEditing?.();
          }}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'stats'
              ? 'border-[#6b94b8] text-[#6b94b8] bg-[#262220]/40'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>📊 {t('nav.statistics')}</span>
        </button>
      </div>

      {/* Tab 1: All Cows Table */}
      {activeTab === 'list' && (
        <AnimalTable
          animals={cows}
          animalType="cow"
          onViewDetail={onViewDetail}
          onEdit={handleEdit}
          onDelete={onDeleteCow}
        />
      )}

      {/* Tab 2: Add / Edit Cow Form */}
      {activeTab === 'add' && (
        <AnimalForm
          animalType="cow"
          initialData={editingCow}
          onSave={handleSave}
          onCancel={() => {
            setEditingCow(null);
            setActiveTab('list');
            onClearEditing?.();
          }}
        />
      )}

      {/* Tab 3: Statistics */}
      {activeTab === 'stats' && (
        <StatisticsTab animals={cows} animalType="cow" />
      )}

    </div>
  );
}
