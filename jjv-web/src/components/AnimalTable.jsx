import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Camera,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function AnimalTable({
  animals,
  animalType,
  onViewDetail,
  onEdit,
  onDelete
}) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeGenderFilter, setActiveGenderFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Status filter chips count calculation
  const counts = useMemo(() => {
    return {
      all: animals.length,
      underTreatment: animals.filter((a) => a.status === 'Under Treatment').length,
      recovered: animals.filter((a) => a.status === 'Recovered').length,
      critical: animals.filter((a) => a.status === 'Critical').length,
      stable: animals.filter((a) => a.status === 'Stable').length
    };
  }, [animals]);

  // Gender filter chips count calculation
  const genderCounts = useMemo(() => {
    const normalize = (g) => (g || '').toString().trim().toLowerCase();
    return {
      all: animals.length,
      male: animals.filter((a) => normalize(a.gender) === 'male').length,
      female: animals.filter((a) => normalize(a.gender) === 'female').length,
      calf: animals.filter((a) => normalize(a.gender) === 'calf').length
    };
  }, [animals]);

  // Filtered and searched data
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      // Status filter chip condition
      if (activeFilter !== 'All' && animal.status !== activeFilter) {
        return false;
      }

      // Gender filter chip condition
      if (activeGenderFilter !== 'All') {
        const animalGender = (animal.gender || '').toString().trim().toLowerCase();
        if (animalGender !== activeGenderFilter.toLowerCase()) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = animal.name?.toLowerCase().includes(query);
        const matchesId = animal.animal_id?.toLowerCase().includes(query);
        const matchesLocation = animal.location_of_rescue?.toLowerCase().includes(query);
        const matchesCondition = animal.condition_at_rescue?.toLowerCase().includes(query);
        const matchesBreed = animal.breed?.toLowerCase().includes(query);
        return matchesName || matchesId || matchesLocation || matchesCondition || matchesBreed;
      }

      return true;
    });
  }, [animals, activeFilter, activeGenderFilter, searchTerm]);

  // Reset to first page when search, status filter, gender filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, activeGenderFilter, pageSize]);

  // Pagination calculation
  const totalItems = filteredAnimals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedAnimals = useMemo(() => {
    return filteredAnimals.slice(startIndex, startIndex + pageSize);
  }, [filteredAnimals, startIndex, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, validCurrentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);

      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

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
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="bg-[#1a1714] p-3 rounded-xl border border-border space-y-2.5">
        
        {/* Top Row: Search Box & Status Filter Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.search')}
              className="w-full bg-[#141110] border border-border rounded-lg pl-9 pr-8 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#6b94b8]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-muted hover:text-foreground text-xs p-0.5"
                title={t('table.clearSearch')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveFilter('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap border ${
                activeFilter === 'All'
                  ? 'bg-[#6b94b8] text-white border-[#6b94b8]'
                  : 'bg-[#262220] text-muted border-border hover:text-foreground'
              }`}
            >
              {t('common.all')} ({counts.all})
            </button>

            <button
              onClick={() => setActiveFilter('Under Treatment')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap border ${
                activeFilter === 'Under Treatment'
                  ? 'bg-[#c9a355] text-black border-[#c9a355]'
                  : 'bg-[#262220] text-muted border-border hover:text-[#c9a355]'
              }`}
            >
              {t('common.underTreatment')} ({counts.underTreatment})
            </button>

            <button
              onClick={() => setActiveFilter('Recovered')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap border ${
                activeFilter === 'Recovered'
                  ? 'bg-[#c27a66] text-white border-[#c27a66]'
                  : 'bg-[#262220] text-muted border-border hover:text-[#c27a66]'
              }`}
            >
              {t('common.recovered')} ({counts.recovered})
            </button>

            <button
              onClick={() => setActiveFilter('Critical')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap border ${
                activeFilter === 'Critical'
                  ? 'bg-[#b55e5e] text-white border-[#b55e5e]'
                  : 'bg-[#262220] text-muted border-border hover:text-[#b55e5e]'
              }`}
            >
              {t('common.critical')} ({counts.critical})
            </button>

            <button
              onClick={() => setActiveFilter('Stable')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap border ${
                activeFilter === 'Stable'
                  ? 'bg-[#6b94b8] text-white border-[#6b94b8]'
                  : 'bg-[#262220] text-muted border-border hover:text-[#6b94b8]'
              }`}
            >
              {t('common.stable')} ({counts.stable})
            </button>
          </div>
        </div>

        {/* Bottom Row: Gender Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider mr-1">
              {t('common.gender')}:
            </span>

            <button
              onClick={() => setActiveGenderFilter('All')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition whitespace-nowrap border ${
                activeGenderFilter === 'All'
                  ? 'bg-[#6b94b8] text-white border-[#6b94b8]'
                  : 'bg-[#262220] text-muted border-border hover:text-foreground'
              }`}
            >
              {t('common.all')} ({genderCounts.all})
            </button>

            <button
              onClick={() => setActiveGenderFilter('Male')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition whitespace-nowrap border ${
                activeGenderFilter === 'Male'
                  ? 'bg-[#4a7194] text-white border-[#4a7194]'
                  : 'bg-[#262220] text-muted border-border hover:text-[#6b94b8]'
              }`}
            >
              ♂ {t('common.male')} ({genderCounts.male})
            </button>

            <button
              onClick={() => setActiveGenderFilter('Female')}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition whitespace-nowrap border ${
                activeGenderFilter === 'Female'
                  ? 'bg-[#c27a66] text-white border-[#c27a66]'
                  : 'bg-[#262220] text-muted border-border hover:text-[#c27a66]'
              }`}
            >
              ♀ {t('common.female')} ({genderCounts.female})
            </button>

            {(animalType === 'cow' || genderCounts.calf > 0) && (
              <button
                onClick={() => setActiveGenderFilter('Calf')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition whitespace-nowrap border ${
                  activeGenderFilter === 'Calf'
                    ? 'bg-[#c9a355] text-black border-[#c9a355]'
                    : 'bg-[#262220] text-muted border-border hover:text-[#c9a355]'
                }`}
              >
                🐮 {t('common.calf')} ({genderCounts.calf})
              </button>
            )}
          </div>

          {(activeFilter !== 'All' || activeGenderFilter !== 'All' || searchTerm.trim() !== '') && (
            <button
              onClick={() => {
                setActiveFilter('All');
                setActiveGenderFilter('All');
                setSearchTerm('');
              }}
              className="text-[11px] text-muted hover:text-[#b55e5e] transition underline decoration-dotted ml-auto"
            >
              {t('table.resetFilters')}
            </button>
          )}
        </div>

      </div>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1714] border-b border-border text-muted font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">{t('common.name')}</th>
                <th className="py-3 px-4">{t('common.dateOfRescue')}</th>
                <th className="py-3 px-4">{t('common.location')}</th>
                <th className="py-3 px-4">{t('common.condition')}</th>
                <th className="py-3 px-4">{t('common.treatment')}</th>
                <th className="py-3 px-4">{t('common.recoveryTime')}</th>
                <th className="py-3 px-4 text-center">{t('common.photos')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-muted">
                    <span className="text-3xl block mb-2">{animalType === 'dog' ? '🐕' : '🐄'}</span>
                    <p className="font-semibold text-foreground text-xs">
                      {animals.length === 0
                        ? t('table.noAnimalsRegistered', { type: animalType === 'dog' ? t('common.dogs') : t('common.cows') })
                        : t('table.noAnimalsMatch', { type: animalType === 'dog' ? t('common.dogs') : t('common.cows') })}
                    </p>
                    <p className="text-[11px] text-muted mt-1 max-w-sm mx-auto">
                      {animals.length === 0 ? (
                        <>{t('table.emptyHint', { type: animalType === 'dog' ? t('common.dog') : t('common.cow') })}</>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveFilter('All');
                            setActiveGenderFilter('All');
                            setSearchTerm('');
                          }}
                          className="text-[#6b94b8] hover:underline"
                        >
                          {t('table.clearFiltersAndSearch')}
                        </button>
                      )}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAnimals.map((animal) => (
                  <tr key={animal.id} className="hover:bg-[#262220]/40 transition">
                    <td className="py-3 px-4 font-mono text-muted whitespace-nowrap">
                      {animal.animal_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{animal.name}</span>
                        <span className="text-[10px] text-muted font-normal">({animal.gender})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {animal.date_of_rescue}
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[160px] truncate" title={animal.location_of_rescue}>
                      {animal.location_of_rescue}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(animal.status)}`}>
                        {animal.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[180px] truncate" title={animal.treatment_details}>
                      {animal.treatment_details || '-'}
                    </td>
                    <td className="py-3 px-4 text-muted whitespace-nowrap">
                      {animal.recovery_time || 'Ongoing'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        {animal.before_image_url ? (
                          <span title="Before Photo Uploaded">📷</span>
                        ) : null}
                        {animal.after_image_url ? (
                          <span title="After Photo Uploaded">✨</span>
                        ) : null}
                        {!animal.before_image_url && !animal.after_image_url && (
                          <span className="text-muted text-[10px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewDetail(animal)}
                          className="px-2.5 py-1 rounded bg-[#262220] hover:bg-[#6b94b8] hover:text-white text-muted transition flex items-center gap-1 text-[11px]"
                          title={t('common.view')}
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => onEdit(animal)}
                          className="px-2 py-1 rounded bg-[#262220] hover:bg-[#c9a355] hover:text-black text-muted transition text-[11px]"
                          title={t('common.edit')}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm(t('common.confirmDelete'))) {
                                onDelete(animal.id);
                              }
                            }}
                            className="px-2 py-1 rounded bg-[#262220] hover:bg-[#b55e5e] hover:text-white text-[#b55e5e] transition text-[11px]"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#1a1714] rounded-xl border border-border text-xs text-muted">
          {/* Left: Records Counter & Page Size Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {t('table.showingRecords', {
                start: startIndex + 1,
                end: endIndex,
                total: totalItems
              })}
            </span>

            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <span>{t('table.perPage')}</span>
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#141110] border border-border text-foreground text-xs rounded px-2 py-1 focus:outline-none focus:border-[#6b94b8]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Right: Navigation Controls */}
          <div className="flex items-center space-x-1">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-[#141110] text-muted hover:text-foreground hover:border-[#6b94b8] disabled:opacity-30 disabled:cursor-not-allowed transition"
              title={t('table.firstPage')}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-[#141110] text-muted hover:text-foreground hover:border-[#6b94b8] disabled:opacity-30 disabled:cursor-not-allowed transition"
              title={t('table.previousPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Number Buttons */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold border transition ${
                    validCurrentPage === pageNum
                      ? 'bg-[#6b94b8] text-white border-[#6b94b8]'
                      : 'bg-[#141110] text-muted border-border hover:text-foreground hover:border-[#6b94b8]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-[#141110] text-muted hover:text-foreground hover:border-[#6b94b8] disabled:opacity-30 disabled:cursor-not-allowed transition"
              title={t('table.nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-[#141110] text-muted hover:text-foreground hover:border-[#6b94b8] disabled:opacity-30 disabled:cursor-not-allowed transition"
              title={t('table.lastPage')}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
