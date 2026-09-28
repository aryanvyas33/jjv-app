import { supabase, isSupabaseConfigured } from './supabase.js';
import { INITIAL_ANIMALS } from './mockData.js';

const LOCAL_STORAGE_KEY = 'jjv_animals_store_v3';

// Clear legacy test data stores completely if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('jjv_animals_store_v1');
    localStorage.removeItem('jjv_animals_store_v2');
  } catch (e) {
    console.warn('Could not clear legacy localStorage stores', e);
  }
}

let inMemoryAnimals = null;

function isQuotaExceededError(err) {
  return (
    err &&
    (err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014 ||
      err.number === -2147024882)
  );
}

function pruneOldImagesForStorage(list, retainCount = 5) {
  return list.map((item, index) => {
    if (index < retainCount) {
      return item;
    }
    const clone = { ...item };
    if (typeof clone.before_image_url === 'string' && clone.before_image_url.startsWith('data:') && clone.before_image_url.length > 500) {
      clone.before_image_url = '';
    }
    if (typeof clone.after_image_url === 'string' && clone.after_image_url.startsWith('data:') && clone.after_image_url.length > 500) {
      clone.after_image_url = '';
    }
    return clone;
  });
}

// Initialize local store if empty
function getLocalAnimals() {
  if (inMemoryAnimals !== null) {
    return inMemoryAnimals;
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        inMemoryAnimals = JSON.parse(stored);
        return inMemoryAnimals;
      }
    } catch (e) {
      console.error('Failed to parse local animals, re-initializing', e);
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_ANIMALS));
    } catch (e) {
      console.warn('Could not initialize localStorage', e);
    }
  }

  inMemoryAnimals = [...INITIAL_ANIMALS];
  return inMemoryAnimals;
}

function saveLocalAnimals(animals) {
  inMemoryAnimals = animals;

  if (typeof localStorage === 'undefined') {
    return;
  }

  // 1. Direct save attempt
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animals));
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn('Could not write to localStorage', err);
      return;
    }
    console.warn('LocalStorage quota exceeded. Attempting graceful recovery strategies...', err);
  }

  // 2. Recovery: Clear legacy stores to free quota
  try {
    localStorage.removeItem('jjv_animals_store_v1');
    localStorage.removeItem('jjv_animals_store_v2');
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animals));
    console.info('LocalStorage quota recovered after purging legacy stores.');
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) return;
  }

  // 3. Recovery: Retain full photos for the 5 most recent rescues, prune older base64 photos in storage
  try {
    const prunedList = pruneOldImagesForStorage(animals, 5);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prunedList));
    console.info('LocalStorage quota recovered by retaining full photos on recent rescues.');
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) return;
  }

  // 4. Recovery: Persist animal record metadata only (prune all large base64 photos from storage)
  try {
    const metadataOnlyList = pruneOldImagesForStorage(animals, 0);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(metadataOnlyList));
    console.info('LocalStorage quota recovered by persisting animal records metadata.');
    return;
  } catch (err) {
    console.warn('LocalStorage quota completely full. Records are preserved safely in memory for this session.', err);
  }
}

/**
 * Dispatches a user feedback event when Supabase operations fail or fall back.
 */
export function notifyCloudSyncStatus(detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('jjv:cloud-sync', {
        detail: {
          timestamp: new Date().toISOString(),
          ...detail
        }
      })
    );
  }
}

export async function fetchAnimals(type = null) {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('animals').select('*').order('date_of_rescue', { ascending: false });
      if (type) {
        query = query.eq('animal_type', type);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local persistent store', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'fetch',
        message: 'Could not connect to Supabase cloud. Loaded offline records from local storage.',
        error: err.message || String(err)
      });
    }
  }

  const list = getLocalAnimals();
  if (type) {
    return list.filter((a) => a.animal_type === type);
  }
  return list;
}

export async function fetchAnimalById(id) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('animals').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase fetchById failed, falling back to local', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'fetchById',
        message: `Could not load record from cloud: ${err.message || 'Connection error'}. Using offline store.`,
        error: err.message || String(err)
      });
    }
  }

  const list = getLocalAnimals();
  return list.find((a) => a.id === id) || null;
}

export async function createAnimal(animalData, user = null) {
  if (isSupabaseConfigured) {
    try {
      const payload = {
        ...animalData,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('animals').insert([payload]).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase create failed, saving to local store', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'create',
        message: `Cloud database write failed (${err.message || 'Connection or permission error'}). Saved to local storage.`,
        error: err.message || String(err)
      });
    }
  }

  // Local fallback
  const list = getLocalAnimals();

  // Generate collision-resistant sequence ID (e.g. JJV-D-001, JJV-C-001)
  const typePrefix = animalData.animal_type === 'dog' ? 'JJV-D-' : 'JJV-C-';
  const regex = new RegExp(`^${typePrefix}(\\d+)$`);
  let maxNum = 0;
  for (const a of list) {
    if (a.animal_id) {
      const match = a.animal_id.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  let finalAnimalId = animalData.animal_id;
  if (!finalAnimalId || list.some((a) => a.animal_id === finalAnimalId)) {
    do {
      finalAnimalId = `${typePrefix}${String(nextNum).padStart(3, '0')}`;
      nextNum++;
    } while (list.some((a) => a.animal_id === finalAnimalId));
  }

  // Generate unique collision-proof internal primary key ID
  let uniqueId = animalData.id;
  if (!uniqueId || list.some((a) => a.id === uniqueId)) {
    do {
      uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `local-${crypto.randomUUID()}`
        : `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    } while (list.some((a) => a.id === uniqueId));
  }

  const newAnimal = {
    ...animalData,
    id: uniqueId,
    animal_id: finalAnimalId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const updatedList = [newAnimal, ...list];
  saveLocalAnimals(updatedList);
  return newAnimal;
}

export async function updateAnimal(id, updates) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('animals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase update failed, updating local store', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'update',
        message: `Cloud update failed (${err.message || 'Connection or permission error'}). Updated offline store.`,
        error: err.message || String(err)
      });
    }
  }

  const list = getLocalAnimals();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) throw new Error('Animal not found');

  const updated = {
    ...list[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  list[index] = updated;
  saveLocalAnimals(list);
  return updated;
}

export async function deleteAnimal(id, requestingUser = null) {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('animals').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase delete failed or rejected by RLS policy', err);
      // If error was an explicit RLS authorization violation from PostgreSQL, rethrow
      if (err.code === '42501' || err.message?.includes('violates row-level security')) {
        const rlsMsg = 'Database RLS Policy Violation: Only administrators can delete animal records.';
        notifyCloudSyncStatus({
          type: 'error',
          operation: 'delete',
          message: rlsMsg,
          error: err.message || String(err)
        });
        throw new Error(rlsMsg);
      }
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'delete',
        message: `Cloud delete failed (${err.message || 'Connection error'}). Proceeding with offline deletion check.`,
        error: err.message || String(err)
      });
    }
  }

  // --- Offline Fallback Execution Branch: Explicit RBAC Enforcement ---
  // Mirroring PostgreSQL Policy: EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin')
  let activeUser = requestingUser;
  if (!activeUser && typeof window !== 'undefined') {
    try {
      const storedSession = localStorage.getItem('jjv_auth_session_v2');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        activeUser = parsed?.user || parsed;
      }
    } catch (e) {
      console.error('Failed to parse auth session for RBAC validation', e);
    }
  }

  if (!activeUser || activeUser.role !== 'admin') {
    const errorMsg = `Unauthorized RBAC Violation: Operation denied. User "${activeUser?.name || 'Staff'}" with role "${activeUser?.role || 'worker'}" cannot delete animal profiles. Only Host/Admin (Rashmi Vyas) is authorized to perform deletions.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const list = getLocalAnimals();
  const filtered = list.filter((a) => a.id !== id);
  saveLocalAnimals(filtered);
  return true;
}

export async function getDashboardStats() {
  const animals = await fetchAnimals();
  const dogs = animals.filter((a) => a.animal_type === 'dog');
  const cows = animals.filter((a) => a.animal_type === 'cow');

  const underTreatmentDogs = dogs.filter((a) => a.status === 'Under Treatment' || a.treatment_ongoing);
  const underTreatmentCows = cows.filter((a) => a.status === 'Under Treatment' || a.treatment_ongoing);

  const recoveredDogs = dogs.filter((a) => a.status === 'Recovered');
  const recoveredCows = cows.filter((a) => a.status === 'Recovered');

  const totalAnimals = animals.length;
  const totalRecovered = recoveredDogs.length + recoveredCows.length;
  const recoveryRate = totalAnimals > 0 ? Math.round((totalRecovered / totalAnimals) * 100) : 0;

  return {
    totalDogs: dogs.length,
    totalCows: cows.length,
    totalAnimals,
    underTreatmentTotal: underTreatmentDogs.length + underTreatmentCows.length,
    underTreatmentDogs: underTreatmentDogs.length,
    underTreatmentCows: underTreatmentCows.length,
    recoveredTotal: totalRecovered,
    recoveredDogs: recoveredDogs.length,
    recoveredCows: recoveredCows.length,
    recoveryRate,
    recentDogs: dogs.slice(0, 3),
    recentCows: cows.slice(0, 3),
    allAnimals: animals
  };
}

export function exportAnimalsCSV(animals) {
  const headers = [
    'Animal ID',
    'Type',
    'Name',
    'Breed',
    'Gender',
    'Estimated Age',
    'Weight (kg)',
    'Rescue Date',
    'Rescue Location',
    'Condition at Rescue',
    'Status',
    'Treatment Ongoing',
    'Recovery Time',
    'Doctor',
    'Rescued By'
  ];

  const rows = animals.map((a) => [
    `"${a.animal_id || ''}"`,
    `"${a.animal_type || ''}"`,
    `"${a.name || ''}"`,
    `"${a.breed || ''}"`,
    `"${a.gender || ''}"`,
    `"${a.estimated_age || ''}"`,
    a.weight_at_rescue || '',
    `"${a.date_of_rescue || ''}"`,
    `"${(a.location_of_rescue || '').replace(/"/g, '""')}"`,
    `"${a.condition_at_rescue || ''}"`,
    `"${a.status || ''}"`,
    a.treatment_ongoing ? 'Yes' : 'No',
    `"${a.recovery_time || ''}"`,
    `"${a.veterinary_doctor || ''}"`,
    `"${a.rescued_by || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `JJV_Bhopal_Census_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Resets all animal records and stats back to absolute zero.
 * Cleans out Supabase (if configured) and all localStorage caches.
 */
export async function resetAllData(user = null) {
  if (!user || user.role !== 'admin') {
    throw new Error('Access denied: Only Shelter Director Rashmi Vyas can reset the database.');
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('animals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Failed to reset Supabase', e);
      notifyCloudSyncStatus({
        type: 'error',
        operation: 'reset',
        message: `Failed to reset Supabase cloud data: ${e.message || String(e)}`,
        error: e.message || String(e)
      });
    }
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('jjv_animals_store_v1');
      localStorage.removeItem('jjv_animals_store_v2');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Could not clear localStorage in resetAllData', e);
    }
  }
  inMemoryAnimals = [];
  return [];
}
