import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const generateSignedUrl = async (bucket: string, path: string): Promise<string | null> => {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string; error: null } | { path: null; error: Error }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) return { path: null, error };
    return { path: data?.path || path, error: null };
  } catch (error) {
    return { path: null, error: error as Error };
  }
};

export const downloadFile = async (bucket: string, path: string): Promise<Blob | null> => {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};
