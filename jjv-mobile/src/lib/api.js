import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  isFirebaseConfigured
} from './firebase';

const LOCAL_STORAGE_KEY = 'jjv_animals_store_v3';

// Clear legacy stores
(async () => {
  try {
    if (AsyncStorage && typeof AsyncStorage.multiRemove === 'function') {
      await AsyncStorage.multiRemove(['jjv_animals_store_v1', 'jjv_animals_store_v2']);
    }
  } catch (e) {}

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('jjv_animals_store_v1');
      window.localStorage.removeItem('jjv_animals_store_v2');
    } catch (e) {}
  }
})();

// Cross-environment persistent storage memory cache
let inMemoryStore = [];

async function getStore() {
  try {
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        inMemoryStore = JSON.parse(stored);
        return inMemoryStore;
      }
    }
  } catch (e) {
    console.warn('Could not read from AsyncStorage, attempting fallback', e);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        inMemoryStore = JSON.parse(stored);
        return inMemoryStore;
      }
    } catch (e) {
      console.warn('Could not read from window.localStorage, using memory cache', e);
    }
  }

  return inMemoryStore;
}

async function saveStore(data) {
  inMemoryStore = data;
  try {
    if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return;
    }
  } catch (e) {
    console.warn('Could not write to AsyncStorage, attempting fallback', e);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not write to window.localStorage', e);
    }
  }
}

const syncListeners = new Set();

export function onCloudSyncStatus(listener) {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

export function notifyCloudSyncStatus(detail) {
  for (const listener of syncListeners) {
    try {
      listener(detail);
    } catch (e) {
      console.warn('Error in sync listener', e);
    }
  }
}

/**
 * Fetch all animal records from Firebase Cloud Firestore (or filtered by 'dog' | 'cow')
 * Automatically synchronizes with local AsyncStorage cache for offline persistence.
 */
export async function fetchAnimals(type = null) {
  if (db && isFirebaseConfigured) {
    try {
      const animalsCol = collection(db, 'animals');
      let q = query(animalsCol, orderBy('date_of_rescue', 'desc'));
      if (type) {
        q = query(animalsCol, where('animal_type', '==', type), orderBy('date_of_rescue', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      const firestoreList = [];
      querySnapshot.forEach((docSnapshot) => {
        firestoreList.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      if (firestoreList.length > 0) {
        // Cache to local storage
        await saveStore(firestoreList);
        notifyCloudSyncStatus({
          type: 'success',
          operation: 'fetch',
          message: `Synced ${firestoreList.length} records with Firebase Firestore.`
        });
        return firestoreList;
      }
    } catch (err) {
      console.warn('Firebase Firestore fetch failed on mobile, using offline store:', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'fetch',
        message: 'Firebase connection offline. Loaded cached records.',
        error: err.message || String(err)
      });
    }
  }

  const list = await getStore();
  if (type) {
    return list.filter((a) => a.animal_type === type);
  }
  return list;
}

/**
 * Create a new animal rescue record in Firebase Cloud Firestore
 * Also persists to local storage cache.
 */
export async function createAnimal(animalData, user = null) {
  const list = await getStore();

  // Generate collision-resistant sequence ID (e.g. JJV-D-001, JJV-C-001)
  const typePrefix = animalData.animal_type === 'cow' ? 'JJV-C-' : 'JJV-D-';
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
        ? `mob-${crypto.randomUUID()}`
        : `mob-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    } while (list.some((a) => a.id === uniqueId));
  }

  const newAnimal = {
    ...animalData,
    id: uniqueId,
    animal_id: finalAnimalId,
    created_by: user?.id || user?.name || 'mobile-worker',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Attempt write to Firebase Cloud Firestore
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'animals', uniqueId);
      await setDoc(docRef, newAnimal);
      notifyCloudSyncStatus({
        type: 'success',
        operation: 'create',
        message: `Saved ${newAnimal.name} (${finalAnimalId}) to Firebase Cloud Firestore.`
      });
    } catch (err) {
      console.warn('Firebase Firestore create failed, saving to offline store', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'create',
        message: `Cloud write pending (${err.message || 'Offline'}). Saved record to device storage.`,
        error: err.message || String(err)
      });
    }
  }

  // Always update local cache immediately
  const updated = [newAnimal, ...list.filter(a => a.id !== uniqueId)];
  await saveStore(updated);
  return newAnimal;
}

/**
 * Update an existing animal rescue record in Firebase Cloud Firestore
 */
export async function updateAnimal(id, updates) {
  const timestamp = new Date().toISOString();
  const cleanUpdates = { ...updates, updated_at: timestamp };

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'animals', id);
      await updateDoc(docRef, cleanUpdates);
      notifyCloudSyncStatus({
        type: 'success',
        operation: 'update',
        message: `Updated record ${id} in Firebase Cloud Firestore.`
      });
    } catch (err) {
      console.warn('Firebase Firestore update failed on mobile, updating offline store', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'update',
        message: `Cloud update failed (${err.message || 'Network error'}). Saved updates to device storage.`,
        error: err.message || String(err)
      });
    }
  }

  const list = await getStore();
  const idx = list.findIndex((a) => a.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...cleanUpdates };
    await saveStore(list);
    return list[idx];
  }

  const fallbackRecord = { id, ...cleanUpdates };
  await saveStore([fallbackRecord, ...list]);
  return fallbackRecord;
}

/**
 * Delete an animal record with RBAC protection in Firebase Cloud Firestore
 */
export async function deleteAnimal(id, requestingUser = null) {
  // Offline and Online RBAC check
  if (!requestingUser || requestingUser.role !== 'admin') {
    throw new Error('Unauthorized: Staff members cannot delete records. Only Host/Admin (Rashmi Vyas) can delete.');
  }

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'animals', id);
      await deleteDoc(docRef);
      notifyCloudSyncStatus({
        type: 'success',
        operation: 'delete',
        message: `Deleted record ${id} from Firebase Cloud Firestore.`
      });
    } catch (err) {
      console.warn('Firebase Firestore delete failed', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'delete',
        message: `Cloud delete failed (${err.message || 'Network error'}). Removed from offline storage.`,
        error: err.message || String(err)
      });
    }
  }

  const list = await getStore();
  const filtered = list.filter((a) => a.id !== id);
  await saveStore(filtered);
  return true;
}

/**
 * Subscribe to real-time updates from Firebase Cloud Firestore
 */
export function subscribeToAnimals(callback, type = null) {
  if (!db || !isFirebaseConfigured) {
    return () => {};
  }

  try {
    const animalsCol = collection(db, 'animals');
    let q = query(animalsCol, orderBy('date_of_rescue', 'desc'));
    if (type) {
      q = query(animalsCol, where('animal_type', '==', type), orderBy('date_of_rescue', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      if (list.length > 0) {
        saveStore(list);
        callback(list);
      }
    }, (error) => {
      console.warn('Firestore snapshot listener error:', error);
    });
  } catch (err) {
    console.warn('Failed to register Firestore snapshot listener:', err);
    return () => {};
  }
}
