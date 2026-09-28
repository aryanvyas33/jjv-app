import { supabase, isSupabaseConfigured } from './supabase';
import { notifyCloudSyncStatus } from './api';

/**
 * Compresses an image file in the browser using HTML5 Canvas
 * to prevent large payloads and keep storage snappy.
 */
export async function compressImage(file, maxDimension = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Supabase Storage or returns compressed base64 data URL
 */
export async function uploadAnimalPhoto(file, folder = 'rescues') {
  if (!file) return null;

  // Compress locally first
  const base64Data = await compressImage(file);

  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Convert base64 to Blob
      const res = await fetch(base64Data);
      const blob = await res.blob();

      const { data, error } = await supabase.storage.from('animal-photos').upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('animal-photos').getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.warn('Supabase storage upload failed, saving compressed base64', err);
      notifyCloudSyncStatus({
        type: 'warning',
        operation: 'storage-upload',
        message: `Cloud storage upload failed (${err.message || 'Storage error'}). Stored compressed image locally.`,
        error: err.message || String(err)
      });
    }
  }

  // Fallback: return compressed base64
  return base64Data;
}
