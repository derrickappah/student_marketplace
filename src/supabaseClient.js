import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Enhanced options for better CORS support
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'X-Client-Info': 'messaging-app',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
  }
};

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

/**
 * Get a properly formatted public URL for a Supabase storage file
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file within bucket
 * @returns {string} Public URL for the file
 */
export const getStorageUrl = (bucket, filePath) => {
  if (!bucket || !filePath) return null;
  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
};

/**
 * Get a signed URL with proper CORS headers for a Supabase storage file
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file within bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 60)
 * @returns {Promise<string>} Promise resolving to signed URL or null on error
 */
export const getSignedUrl = async (bucket, filePath, expiresIn = 60) => {
  if (!bucket || !filePath) return null;
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    
    if (error || !data?.signedUrl) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('Error creating signed URL:', err);
    return null;
  }
};

/**
 * Fix comma-separated URLs or extract the main URL
 * @param {string} url - URL string that might contain comma-separated URLs
 * @returns {string} Fixed URL or original if no fix needed
 */
export const fixCommaSeparatedUrl = (url) => {
  if (!url) return url;
  
  // Handle the specific case of the URLs shown in the error message
  if (url.includes(',https://ivdsmrlcbhanwafntncx.supabase.co/')) {
    return url.split(',https://ivdsmrlcbhanwafntncx.supabase.co/')[0];
  }
  
  // General case of comma-separated URLs
  if (url.includes(',http')) {
    return url.split(',')[0];
  }
  
  return url;
};

/**
 * Parse image URLs from a string or array to ensure consistent handling of comma-separated URLs
 * @param {string|Array} images - Image URLs as string (possibly comma-separated) or array
 * @returns {Array} Array of image URLs
 */
export const parseImageUrls = (images) => {
  if (!images) return [];
  
  // If already an array, return it
  if (Array.isArray(images)) return images;
  
  // If it's a comma-separated string, split it and filter out empty values
  if (typeof images === 'string' && images.includes(',')) {
    return images.split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .map(url => fixCommaSeparatedUrl(url));
  }
  
  // Otherwise, treat as a single image
  return [images];
}; 